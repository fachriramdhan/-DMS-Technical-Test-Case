import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Loading from "../components/common/Loading";
import Alert from "../components/common/Alert";
import Input from "../components/common/Input";
import documentService from "../services/documentService";

const DocumentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [replaceReason, setReplaceReason] = useState("");
  const [replaceFile, setReplaceFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await documentService.getById(id);
      setDocument(response.data);
    } catch (error) {
      showAlert("error", "Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteReason.trim()) {
      showAlert("error", "Please provide a reason");
      return;
    }

    try {
      setActionLoading(true);
      await documentService.requestDelete(id, deleteReason);
      showAlert("success", "Delete request submitted successfully");
      setShowDeleteModal(false);
      fetchDocument();
    } catch (error) {
      showAlert("error", error.response?.data?.message || "Request failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplace = async () => {
    if (!replaceReason.trim() || !replaceFile) {
      showAlert("error", "Please provide reason and select file");
      return;
    }

    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append("reason", replaceReason);
      formData.append("file", replaceFile);

      await documentService.requestReplace(id, formData);
      showAlert("success", "Replace request submitted successfully");
      setShowReplaceModal(false);
      fetchDocument();
    } catch (error) {
      showAlert("error", error.response?.data?.message || "Request failed");
    } finally {
      setActionLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  const downloadFile = () => {
    const fileUrl = documentService.getFileUrl(document.file_url);
    window.open(fileUrl, "_blank");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Loading fullScreen />
      </>
    );
  }

  if (!document) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Alert type="error" message="Document not found" />
          <Button onClick={() => navigate("/documents")} className="mt-4">
            Back to Documents
          </Button>
        </div>
      </>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: "success",
      PENDING_DELETE: "warning",
      PENDING_REPLACE: "warning",
      DELETED: "danger",
    };
    return colors[status] || "secondary";
  };

  const canPerformActions = document.status === "ACTIVE";

  return (
    <div className="page-container bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate("/documents")}
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          }
          className="mb-6"
        >
          Back to Documents
        </Button>

        {/* Alert */}
        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ show: false, type: "", message: "" })}
            className="mb-6"
          />
        )}

        {/* Document Details */}
        <Card className="mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {document.title}
              </h1>
              <Badge variant={getStatusColor(document.status)}>
                {document.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="text-5xl">
              {document.document_type === "PDF"
                ? "📄"
                : document.document_type === "DOC" ||
                    document.document_type === "DOCX"
                  ? "📝"
                  : document.document_type === "XLS" ||
                      document.document_type === "XLSX"
                    ? "📊"
                    : "📎"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">
                Description
              </p>
              <p className="text-gray-900">
                {document.description || "No description"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">
                Document Type
              </p>
              <p className="text-gray-900">{document.document_type}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">
                Created By
              </p>
              <p className="text-gray-900">{document.creator_name}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">
                Created At
              </p>
              <p className="text-gray-900">
                {new Date(document.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">
                Version
              </p>
              <p className="text-gray-900">v{document.version}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">
                File Size
              </p>
              <p className="text-gray-900">
                {document.file_size
                  ? `${(document.file_size / 1024).toFixed(2)} KB`
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={downloadFile}
              icon={
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              }
            >
              Download
            </Button>

            {canPerformActions && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowReplaceModal(true)}
                  icon={
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  }
                >
                  Replace
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                  icon={
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  }
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Request Delete Document"
      >
        <p className="text-gray-600 mb-4">
          Please provide a reason for deleting this document. An admin will
          review your request.
        </p>
        <textarea
          value={deleteReason}
          onChange={(e) => setDeleteReason(e.target.value)}
          placeholder="Enter reason for deletion..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 outline-none"
          rows="4"
        />
        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={actionLoading}
            fullWidth
          >
            Submit Request
          </Button>
        </div>
      </Modal>

      {/* Replace Modal */}
      <Modal
        isOpen={showReplaceModal}
        onClose={() => setShowReplaceModal(false)}
        title="Request Replace Document"
      >
        <p className="text-gray-600 mb-4">
          Upload a new version and provide a reason. An admin will review your
          request.
        </p>
        <Input
          label="Reason"
          value={replaceReason}
          onChange={(e) => setReplaceReason(e.target.value)}
          placeholder="Enter reason for replacement..."
          required
        />
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            New File <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            onChange={(e) => setReplaceFile(e.target.files[0])}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 transition-all duration-200 outline-none"
            required
          />
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowReplaceModal(false)}
            fullWidth
          >
            Cancel
          </Button>
          <Button onClick={handleReplace} loading={actionLoading} fullWidth>
            Submit Request
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentDetailPage;
