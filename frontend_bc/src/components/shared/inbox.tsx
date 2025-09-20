import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/auth/authContext"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserIdByEmail, getNotificationsByUserId, markNotificationAsRead } from "@/features/auth/api"
import { Loader2, CheckCircle, Bell, MailOpen, Clock, Search } from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useState } from "react"

export default function Inbox() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")

  // Step 1: Get userId from email
  const {
    data: userId,
    isLoading: loadingUserId,
    error: errorUserId,
  } = useQuery({
    queryKey: ["userId", user?.email],
    queryFn: () => user?.email ? getUserIdByEmail(user.email) : Promise.reject("No email"),
    enabled: !!user?.email,
  })

  // Step 2: Get notifications for userId
  const {
    data: notifications = [],
    isLoading: loadingNotifications,
    error: errorNotifications,
  } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => typeof userId === "number" ? getNotificationsByUserId(userId) : Promise.resolve([]),
    enabled: typeof userId === "number",
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
      toast.success("Notification marked as read")
    },
    onError: () => toast.error("Failed to mark notification as read"),
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => Promise.all(notifications.filter((n: { read: any }) => !n.read).map((n: { id: number }) => markNotificationAsRead(n.id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] })
      toast.success("All notifications marked as read")
    },
    onError: () => toast.error("Failed to mark all notifications as read"),
  })

  // Sort notifications by createdAt (newest first) and filter by search term
  type Notification = {
    id: number
    message: string
    createdAt: string
    read: boolean
    // add other fields if needed
  }

  const sortedAndFilteredNotifications = (notifications as Notification[])
    .filter((notif) =>
      notif.message.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

  const unreadCount = (notifications as Notification[]).filter(
    (notif) => !notif.read
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Inbox
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Stay updated with your notifications
              </p>
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span>{unreadCount} unread</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{notifications.length - unreadCount} read</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-xl">
          <CardHeader className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Notifications
              </CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Mark all notifications as read"
                >
                  {markAllAsReadMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Mark All as Read
                </Button>
              )}
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                aria-label="Search notifications"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingUserId || loadingNotifications ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="relative">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <div className="absolute inset-0 w-8 h-8 border-2 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-4 font-medium">
                  Loading notifications...
                </p>
              </div>
            ) : errorUserId || errorNotifications ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Unable to load notifications
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
                  An error occurred while fetching notifications. Please try again later.
                </p>
              </div>
            ) : sortedAndFilteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                  <MailOpen className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  No notifications found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
                  {searchTerm ? "No notifications match your search." : "You have no notifications at this time."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {sortedAndFilteredNotifications.map((notif: any, _index: number) => (
                  <div
                    key={notif.id}
                    className={`group relative transition-all duration-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                      !notif.read
                        ? "bg-blue-50/30 dark:bg-blue-950/20 border-l-4 border-l-blue-500"
                        : "bg-white dark:bg-slate-900"
                    }`}
                    role="article"
                    aria-label={`Notification: ${notif.message}`}
                  >
                    <div className="flex items-start gap-4 p-6">
                      <div className="flex-shrink-0 mt-1">
                        {notif.read ? (
                          <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-md"></div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                            notif.read
                              ? "bg-slate-100 dark:bg-slate-800"
                              : "bg-blue-100 dark:bg-blue-900"
                          }`}
                        >
                          {notif.read ? (
                            <CheckCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                          ) : (
                            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p
                              className={`text-sm leading-relaxed transition-colors duration-200 ${
                                notif.read
                                  ? "text-slate-700 dark:text-slate-300"
                                  : "text-slate-900 dark:text-slate-100 font-medium"
                              }`}
                            >
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <time
                                className="text-xs text-slate-500 dark:text-slate-400"
                                dateTime={notif.createdAt}
                              >
                                {new Date(notif.createdAt).toLocaleString("fr-FR", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </time>
                            </div>
                          </div>
                          {!notif.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsReadMutation.mutate(notif.id)}
                              disabled={markAsReadMutation.isPending}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs px-3 py-1 h-auto font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                              aria-label={`Mark notification "${notif.message}" as read`}
                            >
                              {markAsReadMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {sortedAndFilteredNotifications.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {sortedAndFilteredNotifications.length} notification{sortedAndFilteredNotifications.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} theme={document.documentElement.classList.contains("dark") ? "dark" : "light"} />
    </div>
  )
}