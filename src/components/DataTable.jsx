import "../styles/table.css";

export default function DataTable({ data = [], selected, onSelect }) {
    if (!Array.isArray(data) || data.length === 0) {
        return <div className="mm-table-empty">No data available.</div>;
    }

    // Dynamically determine table columns from first row
    const columns = Object.keys(data[0]);

    return (
        <table className="mm-table">
            <thead>
            <tr>
                {columns.map((col) => (
                    <th key={col}>{col.toUpperCase()}</th>
                ))}
            </tr>
            </thead>

            <tbody>
            {data.map((row) => (
                <tr
                    key={row.id || row._id}
                    className={selected?.id === row.id ? "selected" : ""}
                    onClick={() => onSelect && onSelect(row)}
                >
                    {columns.map((col) => (
                        <td key={col}>
                            {row[col] != null && row[col] !== ""
                                ? row[col]
                                : "—"}
                        </td>
                    ))}
                </tr>
            ))}
            </tbody>
        </table>
    );
}
