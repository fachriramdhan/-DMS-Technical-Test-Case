import React, { useState, useEffect } from "react";
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";
import Alert from "../components/common/Alert";
import notificationService from "../services/notificationService";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const isReadFilter = filter === "all" ? null : filter === "read";
      const response = await notificationService.getAll(1, 50, isReadFilter);
      setNotifications(response.data.notifications);
    } catch (error) {
      showAlert("error", "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
      showAlert("success", "Marked as read");
    } catch (error) {
      showAlert("error", "Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
      showAlert("success", "All notifications marked as read");
    } catch (error) {
      showAlert("error", "Failed to mark all as read");
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id);
      fetchNotifications();
      showAlert("success", "Notification deleted");
    } catch (error) {
      showAlert("error", "Failed to delete notification");
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 3000);
  };

  const getNotificationIcon = (type) => {
    const icons = {
      REQUEST: "📩",
      APPROVAL: "✅",
      REJECTION: "❌",
      INFO: "ℹ️",
    };
    return icons[type] || "🔔";
  };

  const getNotificationColor = (type) => {
    const colors = {
      REQUEST: "info",
      APPROVAL: "success",
      REJECTION: "danger",
      INFO: "secondary",
    };
    return colors[type] || "secondary";
  };

  return (
    <div className="page-container bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              Stay updated with your activities
            </p>
          </div>
          {notifications.some((n) => !n.is_read) && (
            <Button size="sm" variant="secondary" onClick={handleMarkAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Alert */}
        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ show: false, type: "", message: "" })}
            className="mb-6"
          />
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === "all"
                ? "bg-primary-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === "unread"
                ? "bg-primary-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter("read")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === "read"
                ? "bg-primary-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Read
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <Loading />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={
              <svg
                className="w-24 h-24"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            }
            title="No notifications"
            description="You're all caught up!"
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif, index) => (
              <Card
                key={notif.id}
                className={`animate-slide-up ${
                  notif.is_read ? "bg-white" : "bg-blue-50 border-blue-200"
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {notif.title}
                        </h3>
                        <Badge
                          variant={getNotificationColor(notif.type)}
                          size="sm"
                          className="mt-1"
                        >
                          {notif.type}
                        </Badge>
                      </div>
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-gray-700 mb-3">{notif.message}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
