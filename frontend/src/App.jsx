
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import "./App.css";

function App() {
  const api = "http://localhost:5000";

  const [token, setToken] = useState("");
  const [manager, setManager] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [queues, setQueues] = useState([]);
  const [queueId, setQueueId] = useState("");
  const [tokens, setTokens] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [dailyTokenTrend, setDailyTokenTrend] = useState([]);

  const [queueName, setQueueName] = useState("");
  const [personName, setPersonName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const login = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${api}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      setToken(data.token);
      setManager(data.manager);
      setMessage("Login successful!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const loadDashboardForQueue = async (id, authToken = token) => {
    if (!id || !authToken) return;

    try {
      const headers = { Authorization: `Bearer ${authToken}` };

      const [t, a] = await Promise.all([
        fetch(`${api}/api/tokens/queue/${id}`, { headers }),
        fetch(`${api}/api/analytics/queue/${id}`, { headers })
      ]);

      const tokenData = await t.json();
      const analyticsData = await a.json();

      if (!t.ok || !a.ok) {
        throw new Error("Could not load selected queue");
      }

      if (tokenData.success) setTokens(tokenData.tokens);

      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
        setDailyTokenTrend(analyticsData.dailyTokenTrend || []);
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  const loadDashboard = async (authToken = token) => {
    if (!authToken) return;

    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const response = await fetch(`${api}/api/queues`, { headers });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load queues");
      }

      setQueues(data.queues);

      if (data.queues.length > 0) {
        const selectedId = data.queues.some(
          (queue) => String(queue.id) === String(queueId)
        )
          ? queueId
          : String(data.queues[0].id);

        setQueueId(selectedId);
        await loadDashboardForQueue(selectedId, authToken);
      } else {
        setQueueId("");
        setTokens([]);
        setAnalytics({});
        setDailyTokenTrend([]);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadDashboard(token);
  }, [token]);

  const performAction = async (url, method = "POST", body = null) => {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Action failed");
      }

      setMessage(data.message || "Action successful!");
      await loadDashboard();
      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const createQueue = async (e) => {
    e.preventDefault();

    if (!queueName.trim()) return;

    const success = await performAction(
      `${api}/api/queues`,
      "POST",
      { name: queueName }
    );

    if (success) setQueueName("");
  };

  const addToken = async (e) => {
    e.preventDefault();

    if (!personName.trim() || !queueId) return;

    const success = await performAction(
      `${api}/api/tokens/queue/${queueId}`,
      "POST",
      { person_name: personName }
    );

    if (success) setPersonName("");
  };

  const callNext = () =>
    performAction(`${api}/api/tokens/queue/${queueId}/call-next`);

  const completeToken = (id) =>
    performAction(`${api}/api/tokens/${id}/complete`, "PATCH");

  const cancelToken = (id) =>
    performAction(`${api}/api/tokens/${id}/cancel`, "PATCH");

  const moveToken = (id, direction) =>
    performAction(
      `${api}/api/tokens/${id}/move`,
      "PATCH",
      { direction }
    );

  const logout = () => {
    setToken("");
    setManager(null);
    setEmail("");
    setPassword("");
    setQueues([]);
    setQueueId("");
    setTokens([]);
    setAnalytics({});
    setDailyTokenTrend([]);
    setMessage("");
  };

  const initials = manager?.name
    ? manager.name.trim().charAt(0).toUpperCase()
    : "M";

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-visual">
          <div className="visual-circle circle-one"></div>
          <div className="visual-circle circle-two"></div>
          <div className="visual-circle circle-three"></div>

          <div className="visual-content">
            <div className="brand-mark">Q</div>
            <p className="visual-eyebrow">QUEUE MANAGEMENT SYSTEM</p>
            <h1>Make every queue run smoothly.</h1>
            <p className="visual-description">
              Organise customers, manage waiting lines and keep your service
              moving with ease.
            </p>

            <div className="visual-mini-card">
              <div className="mini-card-icon">✓</div>
              <div>
                <strong>Everything in order</strong>
                <span>Simple. Organised. Efficient.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-panel">
          <div className="login-form-container">
            <span className="login-small-heading">WELCOME BACK</span>
            <h2>Manager Login</h2>
            <p className="login-subtitle">
              Sign in to access your queue dashboard.
            </p>

            {message && <p className="message">{message}</p>}

            <form onSubmit={login} className="login-form">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button type="submit" className="login-button">
                Sign In
              </button>
            </form>

            <p className="login-footer">
              Queue Management System · Manager Portal
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-screen">Loading your dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="background-shape shape-one"></div>
      <div className="background-shape shape-two"></div>
      <div className="background-shape shape-three"></div>

      <div className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="header-eyebrow">MANAGER WORKSPACE</p>
            <h1>Queue Management</h1>
            <p>Manage your queues and keep everything moving.</p>
          </div>

          <div className="manager-profile">
            <div className="manager-avatar">{initials}</div>
            <div className="manager-details">
              <strong>{manager?.name}</strong>
              <span>Manager</span>
            </div>
            <button className="logout-button" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {message && <p className="message">{message}</p>}

        <section className="queue-section">
          <h2>Create New Queue</h2>
          <form onSubmit={createQueue} className="token-form">
            <input
              type="text"
              placeholder="Enter queue name"
              value={queueName}
              onChange={(e) => setQueueName(e.target.value)}
              required
            />
            <button type="submit" disabled={busy}>
              Create Queue
            </button>
          </form>
        </section>

        <section className="queue-section queue-selector">
          <div>
            <h2>Your Queues</h2>
            <p>Select a queue to manage its tokens and analytics.</p>
          </div>

          {queues.length > 0 ? (
            <select
              value={queueId}
              onChange={(e) => {
                const id = e.target.value;
                setQueueId(id);
                setTokens([]);
                setAnalytics({});
                setDailyTokenTrend([]);
                loadDashboardForQueue(id);
              }}
            >
              {queues.map((queue) => (
                <option key={queue.id} value={queue.id}>
                  {queue.name}
                </option>
              ))}
            </select>
          ) : (
            <p>No queues created yet. Create your first queue above.</p>
          )}
        </section>

        {queueId && (
          <>
            <section className="stats">
              <div className="stat-card">
                <h3>Total Tokens</h3>
                <h2>{analytics.totalTokens || 0}</h2>
              </div>

              <div className="stat-card">
                <h3>Waiting</h3>
                <h2>{analytics.waitingTokens || 0}</h2>
              </div>

              <div className="stat-card">
                <h3>Serving</h3>
                <h2>{analytics.servingTokens || 0}</h2>
              </div>

              <div className="stat-card">
                <h3>Completed</h3>
                <h2>{analytics.completedTokens || 0}</h2>
              </div>

              <div className="stat-card">
                <h3>Cancelled</h3>
                <h2>{analytics.cancelledTokens || 0}</h2>
              </div>

              <div className="stat-card">
                <h3>Current Queue Length</h3>
                <h2>{analytics.currentQueueLength || 0}</h2>
              </div>

              <div className="stat-card">
                <h3>Average Wait</h3>
                <h2>{analytics.averageWaitMinutes || 0}<small> min</small></h2>
              </div>
            </section>

            <section className="queue-section analytics-section">
              <div className="section-heading">
                <div>
                  <h2>Queue Activity</h2>
                  <p>Tokens created over the last seven days.</p>
                </div>
              </div>

              <div className="chart-container">
                {dailyTokenTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyTokenTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar
                        dataKey="totalTokens"
                        name="Tokens created"
                        fill="#7567e8"
                        radius={[7, 7, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-chart">
                    No daily token activity available yet.
                  </div>
                )}
              </div>
              <p className="chart-note">
                This chart shows daily token creation, not historical waiting
                queue length.
              </p>
            </section>

            <section className="queue-section">
              <h2>Generate New Token</h2>
              <form onSubmit={addToken} className="token-form">
                <input
                  type="text"
                  placeholder="Enter person's name"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  required
                />
                <button type="submit" disabled={busy}>
                  Generate Token
                </button>
              </form>
            </section>

            <section className="token-section">
              <div className="section-heading">
                <div>
                  <h2>Token Management</h2>
                  <p>Manage the order and status of your customers.</p>
                </div>

                <button
                  className="call-next-button"
                  onClick={callNext}
                  disabled={busy}
                >
                  Call Next Customer →
                </button>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Person</th>
                      <th>Position</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tokens.map((item) => (
                      <tr key={item.id}>
                        <td>#{item.token_number}</td>
                        <td>{item.person_name}</td>
                        <td>{item.position}</td>
                        <td>
                          <span className={`status ${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="actions">
                          {item.status === "WAITING" && (
                            <>
                              <button
                                disabled={busy}
                                onClick={() => moveToken(item.id, "up")}
                              >
                                ↑
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => moveToken(item.id, "down")}
                              >
                                ↓
                              </button>
                              <button
                                className="cancel-btn"
                                disabled={busy}
                                onClick={() => cancelToken(item.id)}
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {item.status === "SERVING" && (
                            <button
                              disabled={busy}
                              onClick={() => completeToken(item.id)}
                            >
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {tokens.length === 0 && (
                      <tr>
                        <td colSpan="5">No tokens in this queue yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <button
          className="refresh-button"
          onClick={() => loadDashboard()}
          disabled={busy}
        >
          Refresh Dashboard
        </button>
      </div>
    </div>
  );
}

export default App;
