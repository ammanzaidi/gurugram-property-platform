"use client";

import { useEffect, useState } from "react";

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
  };
};

type NotificationItem = {
  id: number;
  enquiryId: number | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

const statusSteps = [
  "NEW",
  "CONTACTED",
  "VISIT_SCHEDULED",
  "VISIT_COMPLETED",
  "CLOSED",
];

export default function MyEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notification, setNotification] = useState("");
  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);
  const [showNotifications, setShowNotifications] =
  useState(false);

  const unreadCount = notifications.filter(
  (item) => !item.isRead
).length;

  useEffect(() => {
    let isMounted = true;

    async function loadEnquiries() {
      try {
        // =====================================================
        // LOAD ENQUIRIES
        // =====================================================

        const response = await fetch("/api/my-enquiries", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Failed to load your enquiries."
          );
        }

        if (isMounted) {
          setEnquiries(result.enquiries || []);
          setError("");
        }

        // =====================================================
        // LOAD DATABASE NOTIFICATIONS
        // =====================================================

        const notificationResponse = await fetch(
          "/api/notifications",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const notificationResult =
          await notificationResponse.json();

        if (
          notificationResponse.ok &&
          notificationResult.success
        ) {
          const notificationList =
            notificationResult.notifications || [];

          if (isMounted) {
            setNotifications(notificationList);
          }

          // ===================================================
          // SHOW LATEST UNREAD NOTIFICATION
          // ===================================================

          const unreadNotification =
            notificationList.find(
              (item: NotificationItem) =>
                !item.isRead
            );

          if (unreadNotification && isMounted) {
            setNotification(
              `🔔 ${unreadNotification.title}: ${unreadNotification.message}`
            );

            // Hide after 6 seconds
            setTimeout(() => {
              if (isMounted) {
                setNotification("");
              }
            }, 6000);
          }
        }
      } catch (error: unknown) {
        console.error(
          "MY ENQUIRIES LOAD ERROR:",
          error
        );

        if (isMounted) {
          setError(
            error instanceof Error ? error.message : "Failed to load your enquiries."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // =======================================================
    // INITIAL LOAD
    // =======================================================

    loadEnquiries();

    // =======================================================
    // REFRESH EVERY 10 SECONDS
    // =======================================================

    const refreshInterval = setInterval(() => {
      loadEnquiries();
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, []);

  // =========================================================
  // STATUS STEP
  // =========================================================

  function getStepIndex(status: string) {
    return statusSteps.indexOf(status);
  }

  // =========================================================
  // FORMAT STATUS
  // =========================================================

  function formatStatus(status: string) {
    return status.replaceAll("_", " ");
  }

  // =========================================================
  // STATUS BADGE STYLE
  // =========================================================

  function getStatusBadgeStyle(status: string) {
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
          color: "#334155",
        };

      default:
        return {
          background: "#f1f5f9",
          color: "#475569",
        };
    }
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
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div style={{ marginBottom: "30px" }}>
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
            My Enquiries
          </h1>

          <p style={{ color: "#64748b" }}>
            Track the status of your property enquiries.
          </p>
        </div>

        {/* =====================================================
            NOTIFICATION
        ====================================================== */}

        {notification && (
          <div
            style={{
              background: "#e8f5e9",
              border: "1px solid #81c784",
              color: "#2e7d32",
              padding: "15px 20px",
              borderRadius: "12px",
              marginBottom: "25px",
              fontWeight: "600",
            }}
          >
            {notification}
          </div>
        )}
{/* =====================================================
    NOTIFICATION HISTORY
====================================================== */}

{notifications.length > 0 && (
  <div
    id="notifications"
    style={{
      background: "white",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "25px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px",
      }}
    >
      <h3
        style={{
          margin: 0,
          color: "#0f172a",
        }}
      >
        🔔 Notifications
      </h3>

      <button
        onClick={() =>
          setShowNotifications(
            !showNotifications
          )
        }
        style={{
          border: "none",
          background: "#eff6ff",
          color: "#2563eb",
          padding: "8px 14px",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        {showNotifications
  ? "Hide"
  : unreadCount > 0
    ? `View All (${notifications.length}) • ${unreadCount} Unread`
    : `View All (${notifications.length})`}
      </button>
    </div>

    {showNotifications && (
      <div
        style={{
          display: "grid",
          gap: "12px",
        }}
      >
        {notifications.map((item) => (
          <div
            key={item.id}
            style={{
              padding: "15px",
              borderRadius: "10px",
              background: item.isRead
                ? "#f8fafc"
                : "#eff6ff",
              border: item.isRead
                ? "1px solid #e2e8f0"
                : "1px solid #bfdbfe",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "flex-start",
                gap: "15px",
              }}
            >
              <div>
                <strong
                  style={{
                    color: "#0f172a",
                  }}
                >
                  {item.title}
                </strong>

                <p
                  style={{
                    margin:
                      "6px 0",
                    color: "#475569",
                  }}
                >
                  {item.message}
                </p>

                <small
                  style={{
                    color: "#94a3b8",
                  }}
                >
                  {new Date(
                    item.createdAt
                  ).toLocaleString()}
                </small>
              </div>

              {!item.isRead && (
                <button
                  onClick={async () => {
                    try {
                      const response =
                        await fetch(
                          `/api/notifications/${item.id}`,
                          {
                            method: "PATCH",
                            credentials:
                              "include",
                          }
                        );

                      const result =
                        await response.json();

                      if (
                        response.ok &&
                        result.success
                      ) {
                        setNotifications(
                          (current) =>
                            current.map(
                              (notification) =>
                                notification.id ===
                                item.id
                                  ? {
                                      ...notification,
                                      isRead: true,
                                    }
                                  : notification
                            )
                        );
                      }
                    } catch (error) {
                      console.error(
                        "Failed to mark notification as read:",
                        error
                      );
                    }
                  }}
                  style={{
                    border: "none",
                    background: "#2563eb",
                    color: "white",
                    padding:
                      "7px 12px",
                    borderRadius: "7px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  Mark as read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading && (
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "16px",
              color: "#475569",
            }}
          >
            Loading your enquiries...
          </div>
        )}

        {/* =====================================================
            ERROR
        ====================================================== */}

        {!loading && error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            {error}
          </div>
        )}

        {/* =====================================================
            EMPTY
        ====================================================== */}

        {!loading &&
          !error &&
          enquiries.length === 0 && (
            <div
              style={{
                background: "white",
                padding: "40px",
                borderRadius: "16px",
                textAlign: "center",
              }}
            >
              <h2>No enquiries yet</h2>

              <p style={{ color: "#64748b" }}>
                Your property enquiries will appear here.
              </p>
            </div>
          )}

        {/* =====================================================
            ENQUIRIES
        ====================================================== */}

        {!loading &&
          !error &&
          enquiries.map((enquiry) => {
            const currentStep =
              getStepIndex(enquiry.status);

            const statusBadge =
              getStatusBadgeStyle(
                enquiry.status
              );

            return (
              <div
                key={enquiry.id}
                style={{
                  background: "white",
                  borderRadius: "18px",
                  padding: "30px",
                  marginBottom: "25px",
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.05)",
                }}
              >
                {/* =================================================
                    TOP
                ================================================== */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
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
                        color: "#64748b",
                        marginTop: "6px",
                      }}
                    >
                      Submitted{" "}
                      {new Date(
                        enquiry.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>

                  {/* CURRENT STATUS */}

                  <span
                    style={{
                      background:
                        statusBadge.background,
                      color: statusBadge.color,
                      padding: "8px 15px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    {formatStatus(
                      enquiry.status
                    )}
                  </span>
                </div>

                {/* =================================================
                    PROPERTY DETAILS
                ================================================== */}

                <div
                  style={{
                    background: "#f8fafc",
                    padding: "20px",
                    borderRadius: "12px",
                    marginTop: "25px",
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>
                    Property Details
                  </h3>

                  <p>
                    <strong>
                      Property ID:
                    </strong>{" "}
                    {enquiry.property.id}
                  </p>

                  <p>
                    <strong>
                      Type:
                    </strong>{" "}
                    {
                      enquiry.property
                        .propertyType
                    }
                  </p>

                  <p>
                    <strong>
                      BHK:
                    </strong>{" "}
                    {enquiry.property.bhk}
                  </p>

                  <p>
                    <strong>
                      Sector:
                    </strong>{" "}
                    {enquiry.property.sector}
                  </p>

                  <p>
                    <strong>
                      Rent:
                    </strong>{" "}
                    ₹
                    {enquiry.property.monthlyRent.toLocaleString(
                      "en-IN"
                    )}
                  </p>

                  <p>
                    <strong>
                      Society:
                    </strong>{" "}
                    {
                      enquiry.property
                        .societyName
                    }
                  </p>
                </div>

                {/* =================================================
                    STATUS TRACKER
                ================================================== */}

                <div
                  style={{
                    marginTop: "30px",
                  }}
                >
                  <h3>Enquiry Progress</h3>

                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                      marginTop: "20px",
                    }}
                  >
                    {statusSteps.map(
                      (step, index) => {
                        const completed =
                          index <=
                          currentStep;

                        const isCurrent =
                          step ===
                          enquiry.status;

                        return (
                          <div
                            key={step}
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: "12px",
                            }}
                          >
                            {/* CIRCLE */}

                            <div
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius:
                                  "50%",
                                background:
                                  completed
                                    ? "#16a34a"
                                    : "#e2e8f0",
                                color:
                                  completed
                                    ? "white"
                                    : "#64748b",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                fontWeight:
                                  "700",
                                flexShrink: 0,
                              }}
                            >
                              {completed
                                ? "✓"
                                : index + 1}
                            </div>

                            {/* TEXT */}

                            <span
                              style={{
                                fontWeight:
                                  isCurrent
                                    ? "700"
                                    : "400",
                                color:
                                  isCurrent
                                    ? "#0f172a"
                                    : "#64748b",
                              }}
                            >
                              {formatStatus(
                                step
                              )}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* =================================================
                    VISIT INFORMATION
                ================================================== */}

                {(enquiry.status ===
                  "VISIT_SCHEDULED" ||
                  enquiry.status ===
                    "VISIT_COMPLETED") &&
                  enquiry.visitDate &&
                  enquiry.visitTime && (
                    <div
                      style={{
                        marginTop: "25px",
                        background:
                          enquiry.status ===
                          "VISIT_COMPLETED"
                            ? "#f0fdf4"
                            : "#fff7ed",
                        border:
                          enquiry.status ===
                          "VISIT_COMPLETED"
                            ? "1px solid #bbf7d0"
                            : "1px solid #fed7aa",
                        padding: "20px",
                        borderRadius: "12px",
                      }}
                    >
                      <h3
                        style={{
                          marginTop: 0,
                          color:
                            enquiry.status ===
                            "VISIT_COMPLETED"
                              ? "#166534"
                              : "#9a3412",
                        }}
                      >
                        {enquiry.status ===
                        "VISIT_COMPLETED"
                          ? "✓ Property Visit Completed"
                          : "📅 Property Visit Scheduled"}
                      </h3>

                      <p>
                        <strong>
                          Date:
                        </strong>{" "}
                        {enquiry.visitDate}
                      </p>

                      <p>
                        <strong>
                          Time:
                        </strong>{" "}
                        {enquiry.visitTime}
                      </p>

                      {enquiry.status ===
                        "VISIT_COMPLETED" && (
                        <p
                          style={{
                            color:
                              "#166534",
                            marginBottom: 0,
                          }}
                        >
                          Your property visit has
                          been completed.
                        </p>
                      )}
                    </div>
                  )}

                {/* =================================================
                    CLOSED MESSAGE
                ================================================== */}

                {enquiry.status ===
                  "CLOSED" && (
                  <div
                    style={{
                      marginTop: "25px",
                      background: "#f1f5f9",
                      border:
                        "1px solid #cbd5e1",
                      padding: "20px",
                      borderRadius: "12px",
                    }}
                  >
                    <h3
                      style={{
                        marginTop: 0,
                        color: "#334155",
                      }}
                    >
                      ✓ Enquiry Closed
                    </h3>

                    <p
                      style={{
                        color: "#475569",
                        marginBottom: 0,
                      }}
                    >
                      This property enquiry has
                      been closed.
                    </p>
                  </div>
                )}

                {/* =================================================
                    MESSAGE
                ================================================== */}

                {enquiry.message && (
                  <div
                    style={{
                      marginTop: "25px",
                      paddingTop: "20px",
                      borderTop:
                        "1px solid #e2e8f0",
                    }}
                  >
                    <h3>My Message</h3>

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
    </main>
  );
}
