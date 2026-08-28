"use client";

import { useEffect, useMemo, useState } from "react";

type Enquiry = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  moveInDate: string | null;
  status: string;
  visitDate: string | null;
  visitTime: string | null;
  createdAt: string;

  property: {
    id: number;
    propertyType: string;
    bhk: string;
    sector: string;
    monthlyRent: number;
    societyName: string;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string;
  };
};

const STATUS_OPTIONS = [
  "ALL",
  "NEW",
  "CONTACTED",
  "VISIT_SCHEDULED",
  "VISIT_COMPLETED",
  "CLOSED",
];

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedStatus, setSelectedStatus] = useState<
    Record<number, string>
  >({});

  const [visitDates, setVisitDates] = useState<
    Record<number, string>
  >({});

  const [visitTimes, setVisitTimes] = useState<
    Record<number, string>
  >({});

  const [updatingId, setUpdatingId] = useState<number | null>(
    null
  );

  const [successMessage, setSuccessMessage] = useState("");

  // =========================================================
  // LOAD ENQUIRIES
  // =========================================================

  useEffect(() => {
    async function loadEnquiries() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/enquiries", {
          credentials: "include",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Failed to load enquiries"
          );
        }

        const list: Enquiry[] = result.enquiries || [];

        setEnquiries(list);

        const statusMap: Record<number, string> = {};
        const dateMap: Record<number, string> = {};
        const timeMap: Record<number, string> = {};

        list.forEach((enquiry) => {
          statusMap[enquiry.id] = enquiry.status;
          dateMap[enquiry.id] = enquiry.visitDate || "";
          timeMap[enquiry.id] = enquiry.visitTime || "";
        });

        setSelectedStatus(statusMap);
        setVisitDates(dateMap);
        setVisitTimes(timeMap);
      } catch (err: any) {
        console.error(err);
        setError(
          err?.message || "Failed to load enquiries."
        );
      } finally {
        setLoading(false);
      }
    }

    loadEnquiries();
  }, []);

  // =========================================================
  // SEARCH + FILTER
  // =========================================================

  const filteredEnquiries = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return enquiries.filter((enquiry) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        enquiry.status === statusFilter;

      const matchesSearch =
        !searchText ||
        enquiry.name.toLowerCase().includes(searchText) ||
        enquiry.phone.toLowerCase().includes(searchText) ||
        String(enquiry.id).includes(searchText) ||
        String(enquiry.property.id).includes(searchText) ||
        enquiry.property.societyName
          .toLowerCase()
          .includes(searchText) ||
        enquiry.property.sector
          .toLowerCase()
          .includes(searchText);

      return matchesStatus && matchesSearch;
    });
  }, [enquiries, search, statusFilter]);

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  async function updateStatus(enquiryId: number) {
    const newStatus = selectedStatus[enquiryId];

    if (!newStatus) return;

    const visitDate = visitDates[enquiryId] || "";
    const visitTime = visitTimes[enquiryId] || "";

    if (
      newStatus === "VISIT_SCHEDULED" &&
      (!visitDate || !visitTime)
    ) {
      setError(
        "Please select visit date and visit time."
      );
      setSuccessMessage("");
      return;
    }

    try {
      setUpdatingId(enquiryId);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/enquiries/${enquiryId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status: newStatus,
            visitDate:
              newStatus === "VISIT_SCHEDULED"
                ? visitDate
                : visitDate || null,
            visitTime:
              newStatus === "VISIT_SCHEDULED"
                ? visitTime
                : visitTime || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to update enquiry."
        );
      }

      setEnquiries((current) =>
        current.map((enquiry) =>
          enquiry.id === enquiryId
            ? {
                ...enquiry,
                status: result.enquiry.status,
                visitDate: result.enquiry.visitDate,
                visitTime: result.enquiry.visitTime,
              }
            : enquiry
        )
      );

      setSelectedStatus((current) => ({
        ...current,
        [enquiryId]: result.enquiry.status,
      }));

      setSuccessMessage(
        `Enquiry #${enquiryId} status updated to ${newStatus}.`
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || "Failed to update enquiry."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // =========================================================
  // STATUS STYLE
  // =========================================================

  function getStatusStyle(status: string) {
    switch (status) {
      case "NEW":
        return {
          background: "#dcfce7",
          color: "#166534",
        };

      case "CONTACTED":
        return {
          background: "#dbeafe",
          color: "#1d4ed8",
        };

      case "VISIT_SCHEDULED":
        return {
          background: "#fef3c7",
          color: "#92400e",
        };

      case "VISIT_COMPLETED":
        return {
          background: "#dcfce7",
          color: "#166534",
        };

      case "CLOSED":
        return {
          background: "#e2e8f0",
          color: "#475569",
        };

      default:
        return {
          background: "#f1f5f9",
          color: "#475569",
        };
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          padding: "40px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            background: "white",
            padding: "30px",
            borderRadius: "16px",
          }}
        >
          Loading enquiries...
        </div>
      </main>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div style={{ marginBottom: "25px" }}>
          <p
            style={{
              color: "#64748b",
              letterSpacing: "3px",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            GURUGRAM PROPERTY
          </p>

          <h1
            style={{
              fontSize: "36px",
              margin: "8px 0",
              color: "#0f172a",
            }}
          >
            Property Enquiries
          </h1>

          <p style={{ color: "#64748b" }}>
            Tenant enquiries received through the platform.
          </p>
        </div>

        {/* SEARCH + FILTER */}

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "25px",
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(250px, 1fr) 220px auto",
              gap: "12px",
            }}
          >
            <input
              type="text"
              placeholder="Search name, phone, property ID, society..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                border:
                  "1px solid #cbd5e1",
                fontSize: "14px",
                outline: "none",
              }}
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                border:
                  "1px solid #cbd5e1",
                background: "white",
                fontSize: "14px",
              }}
            >
              {STATUS_OPTIONS.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status === "ALL"
                    ? "All Statuses"
                    : status.replaceAll("_", " ")}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              style={{
                padding: "12px 18px",
                borderRadius: "8px",
                border: "none",
                background: "#0f172a",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>

          <div
            style={{
              marginTop: "15px",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Showing{" "}
            <strong>
              {filteredEnquiries.length}
            </strong>{" "}
            of{" "}
            <strong>{enquiries.length}</strong>{" "}
            enquiries
          </div>
        </div>

        {/* ERRORS */}

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "18px 20px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {successMessage && (
          <div
            style={{
              background: "#dcfce7",
              color: "#166534",
              padding: "16px 20px",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >
            {successMessage}
          </div>
        )}

        {/* NO RESULTS */}

        {filteredEnquiries.length === 0 && (
          <div
            style={{
              background: "white",
              padding: "40px",
              borderRadius: "16px",
              textAlign: "center",
            }}
          >
            <h2>No enquiries found</h2>

            <p style={{ color: "#64748b" }}>
              Try changing your search or status
              filter.
            </p>
          </div>
        )}

        {/* ENQUIRIES */}

        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          {filteredEnquiries.map((enquiry) => {
            const currentStatus =
              selectedStatus[enquiry.id] ||
              enquiry.status;

            const statusStyle =
              getStatusStyle(enquiry.status);

            const visitDate =
              visitDates[enquiry.id] || "";

            const visitTime =
              visitTimes[enquiry.id] || "";

            const isUpdating =
              updatingId === enquiry.id;

            const hasChanges =
              currentStatus !== enquiry.status;

            return (
              <div
                key={enquiry.id}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "28px",
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.05)",
                }}
              >
                {/* TOP */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    marginBottom: "25px",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        color: "#0f172a",
                      }}
                    >
                      Enquiry #{enquiry.id}
                    </h2>

                    <p
                      style={{
                        marginTop: "6px",
                        color: "#64748b",
                      }}
                    >
                      {new Date(
                        enquiry.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>

                  <span
                    style={{
                      ...statusStyle,
                      padding: "7px 14px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    {enquiry.status}
                  </span>
                </div>

                {/* UPDATE STATUS */}

                <div
                  style={{
                    background: "#f8fafc",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "25px",
                  }}
                >
                  <h3
                    style={{
                      marginTop: 0,
                      marginBottom: "14px",
                    }}
                  >
                    Update Enquiry Status
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <select
                      value={currentStatus}
                      onChange={(e) =>
                        setSelectedStatus(
                          (current) => ({
                            ...current,
                            [enquiry.id]:
                              e.target.value,
                          })
                        )
                      }
                      disabled={isUpdating}
                      style={{
                        padding: "11px 14px",
                        borderRadius: "8px",
                        border:
                          "1px solid #cbd5e1",
                        background: "white",
                        minWidth: "220px",
                      }}
                    >
                      {STATUS_OPTIONS
                        .filter(
                          (status) =>
                            status !== "ALL"
                        )
                        .map((status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status.replaceAll(
                              "_",
                              " "
                            )}
                          </option>
                        ))}
                    </select>

                    {currentStatus ===
                      "VISIT_SCHEDULED" && (
                      <div
                        style={{
                          width: "100%",
                          marginTop: "10px",
                          padding: "18px",
                          background: "white",
                          border:
                            "1px solid #fed7aa",
                          borderRadius: "10px",
                        }}
                      >
                        <h4
                          style={{
                            marginTop: 0,
                            color: "#92400e",
                          }}
                        >
                          Schedule Property Visit
                        </h4>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "15px",
                          }}
                        >
                          <div>
                            <label>
                              <strong>
                                Visit Date
                              </strong>
                            </label>

                            <input
                              type="date"
                              value={visitDate}
                              onChange={(e) =>
                                setVisitDates(
                                  (current) => ({
                                    ...current,
                                    [enquiry.id]:
                                      e.target.value,
                                  })
                                )
                              }
                              style={{
                                width: "100%",
                                marginTop: "7px",
                                padding: "11px",
                                boxSizing:
                                  "border-box",
                                borderRadius: "8px",
                                border:
                                  "1px solid #cbd5e1",
                              }}
                            />
                          </div>

                          <div>
                            <label>
                              <strong>
                                Visit Time
                              </strong>
                            </label>

                            <input
                              type="time"
                              value={visitTime}
                              onChange={(e) =>
                                setVisitTimes(
                                  (current) => ({
                                    ...current,
                                    [enquiry.id]:
                                      e.target.value,
                                  })
                                )
                              }
                              style={{
                                width: "100%",
                                marginTop: "7px",
                                padding: "11px",
                                boxSizing:
                                  "border-box",
                                borderRadius: "8px",
                                border:
                                  "1px solid #cbd5e1",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        updateStatus(
                          enquiry.id
                        )
                      }
                      disabled={
                        isUpdating ||
                        !hasChanges
                      }
                      style={{
                        padding:
                          "11px 20px",
                        borderRadius: "8px",
                        border: "none",
                        background:
                          isUpdating ||
                          !hasChanges
                            ? "#cbd5e1"
                            : "#0f172a",
                        color: "white",
                        fontWeight: "600",
                        cursor:
                          isUpdating ||
                          !hasChanges
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {isUpdating
                        ? "Updating..."
                        : currentStatus ===
                          "VISIT_SCHEDULED"
                        ? "Schedule Visit"
                        : currentStatus ===
                          "VISIT_COMPLETED"
                        ? "Mark Visit Completed"
                        : "Update Status"}
                    </button>
                  </div>
                </div>

                {/* SCHEDULED VISIT */}

                {enquiry.status ===
                  "VISIT_SCHEDULED" &&
                  enquiry.visitDate &&
                  enquiry.visitTime && (
                    <div
                      style={{
                        marginBottom: "25px",
                        padding: "18px 20px",
                        background: "#fffbeb",
                        border:
                          "1px solid #fde68a",
                        borderRadius: "12px",
                      }}
                    >
                      <h3
                        style={{
                          marginTop: 0,
                          color: "#92400e",
                        }}
                      >
                        📅 Scheduled Visit
                      </h3>

                      <p
                        style={{
                          marginBottom: 0,
                        }}
                      >
                        <strong>Date:</strong>{" "}
                        {enquiry.visitDate}
                        {"  "}
                        <strong>Time:</strong>{" "}
                        {enquiry.visitTime}
                      </p>
                    </div>
                  )}

                {/* TENANT + PROPERTY */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "20px",
                  }}
                >
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "20px",
                      borderRadius: "12px",
                    }}
                  >
                    <h3>Tenant Details</h3>

                    <p>
                      <strong>Name:</strong>{" "}
                      {enquiry.name}
                    </p>

                    <p>
                      <strong>Phone:</strong>{" "}
                      {enquiry.phone}
                    </p>

                    <p>
                      <strong>Email:</strong>{" "}
                      {enquiry.email ||
                        "Not provided"}
                    </p>

                    <p>
                      <strong>Move-in:</strong>{" "}
                      {enquiry.moveInDate ||
                        "Not specified"}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "20px",
                      borderRadius: "12px",
                    }}
                  >
                    <h3>Property Details</h3>

                    <p>
                      <strong>
                        Property ID:
                      </strong>{" "}
                      {enquiry.property.id}
                    </p>

                    <p>
                      <strong>Type:</strong>{" "}
                      {
                        enquiry.property
                          .propertyType
                      }
                    </p>

                    <p>
                      <strong>BHK:</strong>{" "}
                      {enquiry.property.bhk}
                    </p>

                    <p>
                      <strong>Sector:</strong>{" "}
                      {enquiry.property.sector}
                    </p>

                    <p>
                      <strong>Rent:</strong> ₹
                      {enquiry.property.monthlyRent.toLocaleString(
                        "en-IN"
                      )}
                    </p>

                    <p>
                      <strong>Society:</strong>{" "}
                      {
                        enquiry.property
                          .societyName
                      }
                    </p>
                  </div>
                </div>

                {/* OWNER */}

                <div
                  style={{
                    marginTop: "20px",
                    background: "#fff7ed",
                    border:
                      "1px solid #fed7aa",
                    padding: "20px",
                    borderRadius: "12px",
                  }}
                >
                  <h3>
                    🔒 Owner / Broker Details
                  </h3>

                  <p>
                    <strong>Name:</strong>{" "}
                    {
                      enquiry.property
                        .ownerName
                    }
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {
                      enquiry.property
                        .ownerPhone
                    }
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {
                      enquiry.property
                        .ownerEmail
                    }
                  </p>
                </div>

                {/* MESSAGE */}

                {enquiry.message && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "20px",
                      borderTop:
                        "1px solid #e2e8f0",
                    }}
                  >
                    <h3>Tenant Message</h3>

                    <p
                      style={{
                        color: "#475569",
                      }}
                    >
                      {enquiry.message}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}