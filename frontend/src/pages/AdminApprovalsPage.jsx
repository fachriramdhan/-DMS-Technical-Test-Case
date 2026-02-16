import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Loading from "../components/common/Loading";
import EmptyState from "../components/common/EmptyState";
import Alert from "../components/common/Alert";
import permissionService from "../services/permissionService";
import { useAuth } from "../context/AuthContext";

const AdminApprovalsPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    if (!isAdmin()) {
      navigate("/dashboard");
      return;
    }
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await permissionService.getAll(1, 50, filter);
      setRequests(response.data.requests);
    } catch (error) {
      showAlert("error", "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!confirm("Are you sure you want to approve this request?")) return;

    try {
      setActionLoading(true);
      await permissionService.approve(requestId);
      showAlert("success", "Request approved successfully");
      fetchRequests();
    } catch (error) {
      showAlert(
        "error",
        error.response?.data?.message || "Failed to approve request",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showAlert("error", "Please provide a rejection reason");
      return;
    }

    try {
      setActionLoading(true);
      await permissionService.reject(selectedRequest.id, rejectReason);
      showAlert("success", "Request rejected successfully");
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      showAlert(
        "error",
        error.response?.data?.message || "Failed to reject request",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const getActionIcon = (actionType) => {
    return actionType === "DELETE" ? "🗑️" : "🔄";
  };

  const getActionColor = (actionType) => {
    return actionType === "DELETE" ? "danger" : "warning";
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "warning",
      APPROVED: "success",
      REJECTED: "danger",
    };
    return colors[status] || "secondary";
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="page-container bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900">
            Approval Requests
          </h1>
          <p className="text-gray-600 mt-1">
            Review and manage document requests
          </p>
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
            onClick={() => setFilter("PENDING")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === "PENDING"
                ? "bg-primary-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("APPROVED")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === "APPROVED"
                ? "bg-primary-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter("REJECTED")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === "REJECTED"
                ? "bg-primary-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Rejected
          </button>
        </div>

        {/* Requests List */}
        {loading ? (
          <Loading />
        ) : requests.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            title="No requests found"
            description={`No ${filter.toLowerCase()} requests at the moment`}
          />
        ) : (
          <div className="space-y-4">
            {requests.map((request, index) => (
              <Card
                key={request.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">
                    {getActionIcon(request.action_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.document_title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={getActionColor(request.action_type)}>
                            {request.action_type}
                          </Badge>
                          <Badge variant={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-1">
                        Reason:
                      </p>
                      <p className="text-gray-600">
                        {request.reason || "No reason provided"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Requested by:</p>
                        <p className="font-medium text-gray-900">
                          {request.requester_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Requested at:</p>
                        <p className="font-medium text-gray-900">
                          {new Date(request.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {request.status === "PENDING" && (
                      <div className="flex gap-3">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={actionLoading}
                          icon={
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openRejectModal(request)}
                          disabled={actionLoading}
                          icon={
                            <svg
                              className="w-4 h-4"
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
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason("");
          setSelectedRequest(null);
        }}
        title="Reject Request"
      >
        <p className="text-gray-600 mb-4">
          Please provide a reason for rejecting this request.
        </p>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Enter rejection reason..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 outline-none"
          rows="4"
        />
        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowRejectModal(false);
              setRejectReason("");
              setSelectedRequest(null);
            }}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleReject}
            loading={actionLoading}
            fullWidth
          >
            Reject Request
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminApprovalsPage;
