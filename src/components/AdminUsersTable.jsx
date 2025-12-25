// src/components/AdminUsersTable.jsx
import { memo, useMemo, useState, useEffect, useCallback } from "react";

const PAGE_SIZE = 25;

function toCreatedText(user) {
    let raw =
        user?.createdAt ??
        user?.created_at ??
        user?.updatedAt ??
        user?.updated_at;

    if (raw == null) return "N/A";

    if (typeof raw === "string" && /^\d+$/.test(raw)) raw = Number(raw);

    let ts;
    if (typeof raw === "number") {
        ts = raw < 1e12 ? raw * 1000 : raw;
    } else {
        ts = new Date(raw).getTime();
    }

    if (Number.isNaN(ts)) return "N/A";
    return new Date(ts).toLocaleString();
}

const UserRow = memo(function UserRow({ u, onDelete }) {
    return (
        <tr>
            <td>{u.id}</td>
            <td>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span>{u._displayName}</span>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                        {u._email}
                    </span>
                </div>
            </td>
            <td>{u._role}</td>
            <td>{u._phone}</td>
            <td>{u._created}</td>
            <td>
                {onDelete && (
                    <button
                        className="admin-mini-btn admin-mini-btn-danger"
                        onClick={() => onDelete(u._raw)}
                    >
                        Delete
                    </button>
                )}
            </td>
        </tr>
    );
});

function AdminUsersTable({ users, onDelete }) {
    const safeUsers = Array.isArray(users) ? users : [];
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [safeUsers.length]);

    const normalized = useMemo(() => {
        return safeUsers.map((user, idx) => {
            const displayName =
                user?.fullName ||
                user?.name ||
                `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                "N/A";

            const email = user?.email || user?.username || "N/A";

            const role =
                user?.role ||
                user?.userRole ||
                user?.type ||
                "CUSTOMER";

            const phone =
                user?.phone ||
                user?.mobile ||
                user?.contactNumber ||
                "N/A";

            return {
                id: user?.id ?? `row-${idx}`,
                _raw: user,
                _displayName: displayName,
                _email: email,
                _role: role,
                _phone: phone,
                _created: toCreatedText(user),
            };
        });
    }, [safeUsers]);

    const totalPages = Math.max(1, Math.ceil(normalized.length / PAGE_SIZE));

    const pageItems = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return normalized.slice(start, start + PAGE_SIZE);
    }, [normalized, page]);

    const goPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
    const goNext = useCallback(
        () => setPage((p) => Math.min(totalPages, p + 1)),
        [totalPages]
    );

    return (
        <div className="table-wrapper">
            <table className="admin-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Name / Email</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Created At</th>
                    <th>Actions</th>
                </tr>
                </thead>

                <tbody>
                {pageItems.length === 0 ? (
                    <tr>
                        <td colSpan={6} style={{ textAlign: "center" }}>
                            No users found.
                        </td>
                    </tr>
                ) : (
                    pageItems.map((u) => (
                        <UserRow key={u.id} u={u} onDelete={onDelete} />
                    ))
                )}
                </tbody>
            </table>

            {normalized.length > PAGE_SIZE && (
                <div className="admin-table-pagination">
                    <button
                        className="med-action-btn"
                        onClick={goPrev}
                        disabled={page <= 1}
                    >
                        Prev
                    </button>

                    <span className="admin-table-pageinfo">
                        Page {page} / {totalPages}
                    </span>

                    <button
                        className="med-action-btn"
                        onClick={goNext}
                        disabled={page >= totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default memo(AdminUsersTable);
