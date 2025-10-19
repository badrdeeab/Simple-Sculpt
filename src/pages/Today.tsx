import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import dayjs from 'dayjs';
import { db } from '../firebase';
import { useRequireAuth } from '../hooks/useAuth';
import { formatDateKey } from '../lib/date';
import slug from '../lib/slug';

type Entry = {
  id: string;
  date: string;
  food: string;
  servings: number;
  kcalPer: number;
  proteinPer: number;
  kcalTotal: number;
  proteinTotal: number;
};

type Goal = {
  kcalTarget: number;
  proteinTarget: number;
};

type Food = {
  id: string;
  name: string;
  kcalPer: number;
  proteinPer: number;
};

const defaultGoal: Goal = {
  kcalTarget: 2000,
  proteinTarget: 150
};

const Today = () => {
  const { user, loading } = useRequireAuth();
  const [selectedDate, setSelectedDate] = useState(formatDateKey());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [goals, setGoals] = useState<Goal>(defaultGoal);
  const [form, setForm] = useState({
    food: '',
    servings: 1,
    kcalPer: 0,
    proteinPer: 0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadGoals = async () => {
      const goalDoc = await getDoc(doc(db, `users/${user.uid}/goals/default`));
      if (goalDoc.exists()) {
        const data = goalDoc.data();
        setGoals({
          kcalTarget: data.kcalTarget ?? defaultGoal.kcalTarget,
          proteinTarget: data.proteinTarget ?? defaultGoal.proteinTarget
        });
      } else {
        setGoals(defaultGoal);
      }
    };

    const loadRecentFoods = async () => {
      const foodsQuery = query(
        collection(db, `users/${user.uid}/foods`),
        orderBy('lastUsedAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(foodsQuery);
      setRecentFoods(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          name: docSnap.data().name,
          kcalPer: docSnap.data().kcalPer,
          proteinPer: docSnap.data().proteinPer
        }))
      );
    };

    loadGoals();
    loadRecentFoods();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const loadEntries = async () => {
      const entriesQuery = query(
        collection(db, `users/${user.uid}/entries`),
        where('date', '==', selectedDate),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(entriesQuery);
      setEntries(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          date: docSnap.data().date,
          food: docSnap.data().food,
          servings: docSnap.data().servings,
          kcalPer: docSnap.data().kcalPer,
          proteinPer: docSnap.data().proteinPer,
          kcalTotal: docSnap.data().kcalTotal,
          proteinTotal: docSnap.data().proteinTotal
        }))
      );
    };

    loadEntries();
  }, [user, selectedDate]);

  const totals = useMemo(
    () =>
      entries.reduce(
        (acc, entry) => ({
          kcal: acc.kcal + entry.kcalTotal,
          protein: acc.protein + entry.proteinTotal
        }),
        { kcal: 0, protein: 0 }
      ),
    [entries]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const kcalTotal = Number(form.servings) * Number(form.kcalPer);
    const proteinTotal = Number(form.servings) * Number(form.proteinPer);

    try {
      const entryData = {
        date: selectedDate,
        food: form.food,
        servings: Number(form.servings),
        kcalPer: Number(form.kcalPer),
        proteinPer: Number(form.proteinPer),
        kcalTotal,
        proteinTotal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, `users/${user.uid}/entries`), entryData);

      const foodId = slug(form.food);
      await setDoc(
        doc(db, `users/${user.uid}/foods/${foodId || Date.now().toString()}`),
        {
          name: form.food,
          kcalPer: Number(form.kcalPer),
          proteinPer: Number(form.proteinPer),
          lastUsedAt: serverTimestamp()
        },
        { merge: true }
      );

      setForm({ food: '', servings: 1, kcalPer: 0, proteinPer: 0 });

      const entriesQuery = query(
        collection(db, `users/${user.uid}/entries`),
        where('date', '==', selectedDate),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(entriesQuery);
      setEntries(
        snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          date: docSnap.data().date,
          food: docSnap.data().food,
          servings: docSnap.data().servings,
          kcalPer: docSnap.data().kcalPer,
          proteinPer: docSnap.data().proteinPer,
          kcalTotal: docSnap.data().kcalTotal,
          proteinTotal: docSnap.data().proteinTotal
        }))
      );

      const foodsQuery = query(
        collection(db, `users/${user.uid}/foods`),
        orderBy('lastUsedAt', 'desc'),
        limit(5)
      );
      const foodsSnapshot = await getDocs(foodsQuery);
      setRecentFoods(
        foodsSnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          name: docSnap.data().name,
          kcalPer: docSnap.data().kcalPer,
          proteinPer: docSnap.data().proteinPer
        }))
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p>Loading…</p>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Today</h1>
        <input
          type="date"
          value={selectedDate}
          max={formatDateKey(dayjs())}
          onChange={(event) => setSelectedDate(event.target.value)}
        />
      </header>

      <section className="card">
        <h2>Add entry</h2>
        <form className="grid" onSubmit={handleSubmit}>
          <label className="form-group">
            <span>Food *</span>
            <input
              required
              value={form.food}
              onChange={(event) => setForm((prev) => ({ ...prev, food: event.target.value }))}
            />
          </label>
          <label className="form-group">
            <span>Servings *</span>
            <input
              type="number"
              step="0.1"
              min="0"
              value={form.servings}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, servings: Number(event.target.value) }))
              }
              required
            />
          </label>
          <label className="form-group">
            <span>Kcal per serving *</span>
            <input
              type="number"
              min="0"
              value={form.kcalPer}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, kcalPer: Number(event.target.value) }))
              }
              required
            />
          </label>
          <label className="form-group">
            <span>Protein per serving *</span>
            <input
              type="number"
              min="0"
              value={form.proteinPer}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, proteinPer: Number(event.target.value) }))
              }
              required
            />
          </label>
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Add entry'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Totals</h2>
        <div className="totals">
          <div>
            <strong>{totals.kcal.toFixed(0)}</strong> / {goals.kcalTarget} kcal
          </div>
          <div>
            <strong>{totals.protein.toFixed(0)}</strong> / {goals.proteinTarget} g protein
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Entries</h2>
        {entries.length === 0 ? (
          <p>No entries yet.</p>
        ) : (
          <ul className="list">
            {entries.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{entry.food}</strong>
                  <span>{entry.servings} servings</span>
                </div>
                <div className="entry-macros">
                  <span>{entry.kcalTotal.toFixed(0)} kcal</span>
                  <span>{entry.proteinTotal.toFixed(0)} g protein</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Recent foods</h2>
        {recentFoods.length === 0 ? (
          <p>No saved foods yet.</p>
        ) : (
          <ul className="list">
            {recentFoods.map((food) => (
              <li key={food.id} className="recent-food">
                <div>
                  <strong>{food.name}</strong>
                  <span>
                    {food.kcalPer} kcal / {food.proteinPer} g
                  </span>
                </div>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setForm({
                      food: food.name,
                      servings: 1,
                      kcalPer: food.kcalPer,
                      proteinPer: food.proteinPer
                    })
                  }
                >
                  Use
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Today;
