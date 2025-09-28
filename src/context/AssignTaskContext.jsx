import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import AssignTaskModal from "../components/AssignTaskModal";

const AssignTaskContext = createContext(null);

export function AssignTaskProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const openAssignModal = useCallback((member) => {
    setSelectedMember(member || null);
    setIsOpen(true);
  }, []);

  const closeAssignModal = useCallback(() => {
    setIsOpen(false);
    setSelectedMember(null);
  }, []);

  const handleSubmit = useCallback(async (form) => {
    const payload = {
      assigneeId: selectedMember?.id || selectedMember?.code || selectedMember?.email || null,
      assigneeName: selectedMember?.name || selectedMember?.fullName || "",
      title: form.title,
      dueDate: form.dueDate,
      labels: form.labels,
      createdAt: new Date().toISOString(),
      source: "assign-modal",
    };
    console.log("[AssignTask] submit", payload);
    closeAssignModal();
  }, [selectedMember, closeAssignModal]);

  const value = useMemo(() => ({
    isOpen, selectedMember, openAssignModal, closeAssignModal, handleSubmit
  }), [isOpen, selectedMember, openAssignModal, closeAssignModal, handleSubmit]);

  return (
    <AssignTaskContext.Provider value={value}>
      {children}
      {isOpen && (
        <AssignTaskModal
          member={selectedMember}
          onClose={closeAssignModal}
          onSubmit={handleSubmit}
        />
      )}
    </AssignTaskContext.Provider>
  );
}

export function useAssignTask() {
  const ctx = useContext(AssignTaskContext);
  if (!ctx) throw new Error("useAssignTask must be used within AssignTaskProvider");
  return ctx;
}