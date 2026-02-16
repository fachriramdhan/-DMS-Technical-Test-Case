import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Loading from "../components/common/Loading";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import documentService from "../services/documentService";

const DocumentsPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    documentType: "PDF",
    file: null,
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  useEffect(() => {
    fetchDocuments();
  }, [currentPage, searchQuery]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getAll(
        currentPage,
        10,
        searchQuery,
      );
      setDocuments(response.data.documents);
      setPagination(response.data.pagination);
    } catch (error) {
      showAlert("error", "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleUploadFormChange = (e) => {
    const { name, value, files } = e.target;
    setUploadForm({
      ...uploadForm,
      [name]: files ? files[0] : value,
    });
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      formData.append("documentType", uploadForm.documentType);
      formData.append("file", uploadForm.file);

      await documentService.upload(formData);

      showAlert("success", "Document uploaded successfully!");
      setShowUploadModal(false);
      setUploadForm({
        title: "",
        description: "",
        documentType: "PDF",
        file: null,
      });
      fetchDocuments();
    } catch (error) {
      showAlert("error", error.response?.data?.message || "Upload failed");
    } finally {
      setUploadLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
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
      TXT: "📃",
      JPG: "🖼️",
      JPEG: "🖼️",
      PNG: "🖼️",
    };
    return icons[type?.toUpperCase()] || "📎";
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: "success",
      PENDING_DELETE: "warning",
      PENDING_REPLACE: "warning",
      DELETED: "danger",
    };
    return colors[status] || "secondary";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="page-container bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600 mt-1">Manage all your documents</p>
          </div>
          <Button
            onClick={() => setShowUploadModal(true)}
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          >
            Upload Document
          </Button>
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

        {/* Search & Filter */}
        <Card className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search documents by title, description, or type..."
                value={searchQuery}
                onChange={handleSearch}
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
              />
            </div>
          </div>
        </Card>

        {/* Documents List */}
        {loading ? (
          <Loading />
        ) : documents.length === 0 ? (
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
            title="No documents found"
            description={
              searchQuery
                ? "Try adjusting your search"
                : "Upload your first document to get started"
            }
            actionLabel={!searchQuery ? "Upload Document" : null}
            onAction={!searchQuery ? () => setShowUploadModal(true) : null}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {documents.map((doc, index) => (
                <Card
                  key={doc.id}
                  hover
                  className="animate-slide-up cursor-pointer"
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-4xl">
                        {getDocumentIcon(doc.document_type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {doc.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            {doc.creator_name}
                          </span>
                          <span className="flex items-center gap-1">
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
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>v{doc.version}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusColor(doc.status)}>
                        {doc.status.replace("_", " ")}
                      </Badge>
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(pagination.totalPages, prev + 1),
                    )
                  }
                  disabled={currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload New Document"
        size="md"
      >
        <form onSubmit={handleUploadSubmit}>
          <Input
            label="Document Title"
            name="title"
            value={uploadForm.title}
            onChange={handleUploadFormChange}
            placeholder="Enter document title"
            required
          />

          <Input
            label="Description"
            name="description"
            value={uploadForm.description}
            onChange={handleUploadFormChange}
            placeholder="Enter document description (optional)"
          />

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              name="documentType"
              value={uploadForm.documentType}
              onChange={handleUploadFormChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 outline-none"
              required
            >
              <option value="PDF">PDF</option>
              <option value="DOC">DOC</option>
              <option value="DOCX">DOCX</option>
              <option value="XLS">XLS</option>
              <option value="XLSX">XLSX</option>
              <option value="PPT">PPT</option>
              <option value="PPTX">PPTX</option>
              <option value="TXT">TXT</option>
              <option value="IMAGE">IMAGE</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              name="file"
              onChange={handleUploadFormChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-500 transition-all duration-200 outline-none"
              required
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
            />
            <p className="text-xs text-gray-500 mt-1">Max file size: 10MB</p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowUploadModal(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button type="submit" loading={uploadLoading} fullWidth>
              Upload
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DocumentsPage;
