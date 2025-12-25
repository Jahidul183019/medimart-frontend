import { useNavigate } from "react-router-dom";
import { isLoggedIn, logout } from "../utils/authUtil";

export default function Topbar() {
    const navigate = useNavigate();
    const loggedIn = isLoggedIn();

    return (
        <div className="topbar">
            {/* ...your left side logo/search etc... */}

            <div className="topbar-actions">
                {/* Only logged-in users should see these */}
                {loggedIn && (
                    <>
                        <button onClick={() => navigate("/orders/history")}>Order History</button>
                        <button onClick={() => navigate("/profile")}>Profile</button>
                    </>
                )}

                {/* Guest sees Login, user sees Logout */}
                {!loggedIn ? (
                    <button onClick={() => navigate("/auth")}>Login</button>
                ) : (
                    <button
                        onClick={() => {
                            logout();
                            navigate("/auth");
                        }}
                    >
                        Logout
                    </button>
                )}
            </div>
        </div>
    );
}
