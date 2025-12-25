// src/components/UserTable.jsx
export default function UserTable({ users }) {
    // Ensure we always work with an array
    const safeUsers = Array.isArray(users) ? users : [];

    return (
        <div className="table-wrapper">
            <table className="admin-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Joined</th>
                </tr>
                </thead>

                <tbody>
                {safeUsers.length === 0 ? (
                    <tr>
                        <td colSpan={6} style={{ textAlign: "center" }}>
                            No users found.
                        </td>
                    </tr>
                ) : (
                    safeUsers.map((u) => {
                        const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim();

                        const joined =
                            u.createdAt &&
                            !isNaN(new Date(u.createdAt).getTime())
                                ? new Date(u.createdAt).toLocaleDateString()
                                : "N/A";

                        return (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{fullName || "N/A"}</td>
                                <td>{u.email || "N/A"}</td>
                                <td>{u.phone || "-"}</td>
                                <td>{u.role || "CUSTOMER"}</td>
                                <td>{joined}</td>
                            </tr>
                        );
                    })
                )}
                </tbody>
            </table>
        </div>
    );
}
