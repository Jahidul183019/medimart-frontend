import "../styles/notificationPanel.css";

export default function NotificationPanel({
                                              notifications = [],
                                              onMarkRead,
                                              onClose,
                                          }) {
    return (
        <div className="np-panel">
            <div className="np-header">
                <h4>Notifications</h4>
                <button className="np-close" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="np-body">
                {notifications.length === 0 && (
                    <div className="np-empty">No notifications</div>
                )}

                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`np-item ${n.readStatus ? "read" : "unread"}`}
                        onClick={() => onMarkRead?.(n.id)}
                    >
                        <div className="np-title">{n.title}</div>
                        <div className="np-message">{n.message}</div>

                        <div className="np-meta">
                            <span className={`np-type ${n.type?.toLowerCase()}`}>
                                {n.type}
                            </span>
                            {!n.readStatus && <span className="np-dot" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
