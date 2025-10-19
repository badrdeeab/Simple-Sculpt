import { FormEvent, useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useRequireAuth } from '../hooks/useAuth';

type GoalForm = {
  kcalTarget: number;
  proteinTarget: number;
};

const Settings = () => {
  const { user, loading } = useRequireAuth();
  const [form, setForm] = useState<GoalForm>({ kcalTarget: 2000, proteinTarget: 150 });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadGoals = async () => {
      const goalDoc = await getDoc(doc(db, `users/${user.uid}/goals/default`));
      if (goalDoc.exists()) {
        const data = goalDoc.data();
        setForm({
          kcalTarget: data.kcalTarget ?? 2000,
          proteinTarget: data.proteinTarget ?? 150
        });
      }
    };

    loadGoals();
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setStatus(null);

    try {
      await setDoc(
        doc(db, `users/${user.uid}/goals/default`),
        {
          kcalTarget: Number(form.kcalTarget),
          proteinTarget: Number(form.proteinTarget),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      setStatus('Saved!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading…</p>;
  }

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>
      <form className="card" onSubmit={handleSubmit}>
        <label className="form-group">
          <span>Daily calorie target</span>
          <input
            type="number"
            min="0"
            value={form.kcalTarget}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, kcalTarget: Number(event.target.value) }))
            }
            required
          />
        </label>
        <label className="form-group">
          <span>Daily protein target</span>
          <input
            type="number"
            min="0"
            value={form.proteinTarget}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, proteinTarget: Number(event.target.value) }))
            }
            required
          />
        </label>
        <button className="button primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save goals'}
        </button>
        {status ? <p className="success-text">{status}</p> : null}
      </form>
    </div>
  );
};

export default Settings;
