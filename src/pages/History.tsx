import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import dayjs from 'dayjs';
import { db } from '../firebase';
import { useRequireAuth } from '../hooks/useAuth';
import { formatDisplayDate } from '../lib/date';

type Entry = {
  id: string;
  date: string;
  food: string;
  kcalTotal: number;
  proteinTotal: number;
};

type GroupedEntries = Record<
  string,
  {
    entries: Entry[];
    totals: {
      kcal: number;
      protein: number;
    };
  }
>;

const History = () => {
  const { user, loading } = useRequireAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadEntries = async () => {
      const end = dayjs().format('YYYY-MM-DD');
      const start = dayjs().subtract(13, 'day').format('YYYY-MM-DD');
      const entriesQuery = query(
        collection(db, `users/${user.uid}/entries`),
        where('date', '>=', start),
        where('date', '<=', end),
        orderBy('date', 'desc'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(entriesQuery);
      setEntries(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          date: docSnap.data().date,
          food: docSnap.data().food,
          kcalTotal: docSnap.data().kcalTotal,
          proteinTotal: docSnap.data().proteinTotal
        }))
      );
    };

    loadEntries();
  }, [user]);

  const grouped: GroupedEntries = useMemo(() => {
    return entries.reduce<GroupedEntries>((acc, entry) => {
      const existing = acc[entry.date] ?? {
        entries: [],
        totals: { kcal: 0, protein: 0 }
      };
      existing.entries.push(entry);
      existing.totals.kcal += entry.kcalTotal;
      existing.totals.protein += entry.proteinTotal;
      acc[entry.date] = existing;
      return acc;
    }, {} as GroupedEntries);
  }, [entries]);

  const dates = useMemo(() => Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1)), [grouped]);

  const handleToggle = (date: string) => {
    setExpanded((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, `users/${user.uid}/entries/${id}`));
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <p>Loading…</p>;
  }

  return (
    <div className="page">
      <h1 className="page-title">History</h1>
      {dates.length === 0 ? (
        <p>No entries yet.</p>
      ) : (
        <ul className="list">
          {dates.map((date) => {
            const group = grouped[date];
            return (
              <li key={date} className="history-day">
                <button className="history-toggle" type="button" onClick={() => handleToggle(date)}>
                  <div>
                    <strong>{formatDisplayDate(date)}</strong>
                  </div>
                  <div>
                    {group.totals.kcal.toFixed(0)} kcal · {group.totals.protein.toFixed(0)} g protein
                  </div>
                </button>
                {expanded[date] ? (
                  <ul className="sub-list">
                    {group.entries.map((entry) => (
                      <li key={entry.id}>
                        <div>
                          <strong>{entry.food}</strong>
                          <span>
                            {entry.kcalTotal.toFixed(0)} kcal · {entry.proteinTotal.toFixed(0)} g
                          </span>
                        </div>
                        <button
                          className="button danger"
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleting === entry.id}
                        >
                          {deleting === entry.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default History;
