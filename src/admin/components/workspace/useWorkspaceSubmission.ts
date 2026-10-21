import { useState, useEffect } from 'react';
import { Submission } from '../../../types';
import { authFetch } from '../../../lib/apiCache';
import { SavedFileState } from './workspaceTypes';

export function useWorkspaceSubmission(
  submissionId: string,
  imageEditor: any,
  showToast: (msg: string) => void
) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFileId, setActiveFileId] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [savedFileStates, setSavedFileStates] = useState<Record<string, SavedFileState>>({});
  const [savedNotice, setSavedNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSub = async () => {
      setLoading(true);
      try {
        let tid = submissionId;
        if (!tid) {
          const lRes = await authFetch('/api/admin/submissions');
          if (lRes.ok) {
            const ld = await lRes.json();
            if (ld.submissions?.length > 0) tid = ld.submissions[0].id;
          }
        }
        if (!tid) return setError('No submissions in queue.');
        const res = await authFetch(`/api/admin/submissions/${tid}`);
        if (res.ok) {
          const d = await res.json();
          setSubmission(d.submission);
          const st = d.submission.workspace_state || {};
          setSavedFileStates(st);
          if (d.submission.files?.length > 0) {
            const fId = d.submission.files[0].id || d.submission.files[0].filename;
            setActiveFileId(fId);
            setSelectedFileIds(d.submission.files.map((f: any) => f.id || f.filename));
            if (st[fId]) imageEditor.loadSavedState(st[fId]);
          }
        } else setError('Submission not found.');
      } catch { setError('Failed to load submission.'); }
      finally { setLoading(false); }
    };
    fetchSub();
  }, [submissionId]);

  const handleSelectFile = (fileId: string) => {
    setActiveFileId(fileId);
    if (savedFileStates[fileId]) imageEditor.loadSavedState(savedFileStates[fileId]);
    else imageEditor.resetAll();
  };

  const handleToggleSelectFile = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleSaveState = async () => {
    if (!activeFileId || !submission) return;
    setIsSaving(true);
    const curr = imageEditor.getCurrentState();
    const nextStates = { ...savedFileStates, [activeFileId]: curr };
    setSavedFileStates(nextStates);
    try {
      await authFetch(`/api/admin/submissions/${submission.id}/workspace-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceState: nextStates }),
      });
      setSavedNotice(true);
      showToast('Workspace state saved to server & memory!');
      setTimeout(() => setSavedNotice(false), 2000);
    } catch { showToast('Saved locally.'); }
    finally { setIsSaving(false); }
  };

  return {
    submission,
    loading,
    error,
    activeFileId,
    setActiveFileId,
    selectedFileIds,
    savedFileStates,
    savedNotice,
    isSaving,
    handleSelectFile,
    handleToggleSelectFile,
    handleSaveState,
  };
}
