import React, { useState, useEffect } from "react";
import { useAssignTask } from "../context/AssignTaskContext";

export default function AssignTaskModal({ member, onClose, onSubmit }) {
  const { openAssignModal } = useAssignTask();
  const { openAssignModal } = useAssignTask();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [labels, setLabels] = useState("");

  useEffect(() => {
    const onKey = (e) => {
  const { openAssignModal } = useAssignTask(); if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    onSubmit?.({ title: title.trim(), dueDate, labels: labels.trim() });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card modal-card--sheet">
        <div className="modal-header">
          <h3>Giao việc</h3>
          <button className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>

        <p className="modal-subtitle">
          Giao nhiệm vụ trực tiếp cho: <strong>{member?.name || "—"}</strong>
        </p>

        <form className="modal-form" onSubmit={submit}>
          <div className="form-row">
            <span className="input-icon">📝</span>
            <input className="input" placeholder="Tiêu đề công việc" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="form-row">
            <span className="input-icon">📅</span>
            <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div className="form-row">
            <span className="input-icon">🏷️</span>
            <input className="input" placeholder="Nhãn (ví dụ: UI, API)" value={labels} onChange={(e) => setLabels(e.target.value)} />
          </div>

        <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
            <button onClick={() => openAssignModal(member)}>
  Giao việc
</button>
          </div>
        </form>
      </div>
    </div>
  );
}