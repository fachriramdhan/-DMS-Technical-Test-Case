import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Loading from "../components/common/Loading";
import documentService from "../services/documentService";
import notificationService from "../services/notificationService";

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    pendingRequests: 0,
    recentDocuments: [],
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch documents
      const docsResponse = await documentService.getAll(1, 5);

      // Fetch notifications
      const notifsResponse = await notificationService.getAll(1, 5);

      setStats({
        totalDocuments: docsResponse.data.pagination.totalItems,
        recentDocuments: docsResponse.data.documents,
      });

      setNotifications(notifsResponse.data.notifications);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentIcon = (type) => {
    const icons = {
      PDF: "📄",
      DOC: "📝",
      DOCX: "📝",
      XLS: "📊",
      XLSX: "📊",
      PPT: "📊",
      PPTX: "📊",
    };
    return icons[type?.toUpperCase()] || "📎";
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loading fullScreen text="Loading dashboard..." />
      </>
    );
  }

  return (
    <div className="page-container bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your documents today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 mb-8">
          {" "}
          {/* Pakai grid-cols-3 langsung */}
          <Card className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between">
              <div>
                {/* Hidden on mobile, shown on tablet (md) and up */}
                <p className="hidden md:block text-sm font-medium text-gray-600">
                  Total Documents
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-0 md:mt-2">
                  {stats.totalDocuments}
                </p>
              </div>
              <div className="bg-primary-100 p-2 md:p-4 rounded-xl">
                <svg
                  className="w-6 h-6 md:w-8 md:h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="hidden md:block text-sm font-medium text-gray-600">
                  Active Documents
                </p>
                <p className="text-2xl md:text-3xl font-bold text-green-600 mt-0 md:mt-2">
                  {
                    stats.recentDocuments.filter((d) => d.status === "ACTIVE")
                      .length
                  }
                </p>
              </div>
              <div className="bg-green-100 p-2 md:p-4 rounded-xl">
                <svg
                  className="w-6 h-6 md:w-8 md:h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>
          <Card className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="hidden md:block text-sm font-medium text-gray-600">
                  Notifications
                </p>
                <p className="text-2xl md:text-3xl font-bold text-accent-600 mt-0 md:mt-2">
                  {notifications.length}
                </p>
              </div>
              <div className="bg-accent-100 p-2 md:p-4 rounded-xl">
                <svg
                  className="w-6 h-6 md:w-8 md:h-8 text-accent-600"
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
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Documents */}
          <Card
            title="Recent Documents"
            subtitle="Your latest uploaded files"
            headerAction={
              <Button size="sm" onClick={() => navigate("/documents")}>
                View All
              </Button>
            }
            className="animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="space-y-3">
              {stats.recentDocuments.length > 0 ? (
                stats.recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                    onClick={() => navigate(`/documents/${doc.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">
                        {getDocumentIcon(doc.document_type)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {doc.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={doc.status === "ACTIVE" ? "success" : "warning"}
                    >
                      {doc.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No documents yet</p>
                  <Button
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate("/documents")}
                  >
                    Upload Your First Document
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Notifications */}
          <Card
            title="Recent Notifications"
            subtitle="Stay updated"
            headerAction={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate("/notifications")}
              >
                View All
              </Button>
            }
            className="animate-slide-up"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border ${
                      notif.is_read
                        ? "bg-white border-gray-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {notif.type === "REQUEST"
                          ? "📩"
                          : notif.type === "APPROVAL"
                            ? "✅"
                            : "❌"}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {notif.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No notifications</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card
          title="Quick Actions"
          className="mt-6 animate-slide-up"
          style={{ animationDelay: "0.6s" }}
        >
          {/* Tetap 3 kolom di semua ukuran layar */}
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <button
              onClick={() => navigate("/documents")}
              className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 p-2 md:p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all"
            >
              <div className="bg-primary-100 p-2 md:p-3 rounded-lg">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div className="text-center md:text-left">
                <p className="text-xs md:text-base font-semibold text-gray-900 leading-tight">
                  Upload Document
                </p>
                {/* Baris ke-2 di-hide saat mobile */}
                <p className="hidden md:block text-sm text-gray-500">
                  Add new files
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate("/documents")}
              className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 p-2 md:p-4 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all"
            >
              <div className="bg-green-100 p-2 md:p-3 rounded-lg">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="text-center md:text-left">
                <p className="text-xs md:text-base font-semibold text-gray-900 leading-tight">
                  Search Documents
                </p>
                {/* Baris ke-2 di-hide saat mobile */}
                <p className="hidden md:block text-sm text-gray-500">
                  Find files quickly
                </p>
              </div>
            </button>

            {isAdmin() && (
              <button
                onClick={() => navigate("/admin/approvals")}
                className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 p-2 md:p-4 rounded-lg border-2 border-gray-200 hover:border-accent-500 hover:bg-accent-50 transition-all"
              >
                <div className="bg-accent-100 p-2 md:p-3 rounded-lg">
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-accent-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xs md:text-base font-semibold text-gray-900 leading-tight">
                    Pending Approvals
                  </p>
                  {/* Baris ke-2 di-hide saat mobile */}
                  <p className="hidden md:block text-sm text-gray-500">
                    Review requests
                  </p>
                </div>
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
