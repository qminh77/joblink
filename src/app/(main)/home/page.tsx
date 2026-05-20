"use client"

import { useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import {
  BarChart2,
  Bookmark,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  Globe,
  Image as ImageIcon,
  Link as LinkIcon,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  ThumbsUp,
  UserPlus,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"
import {
  btnTap,
  fadeUp,
  modalContent,
  modalOverlay,
  pageEntrance,
  slideLeft,
  slideRight,
  staggerSm,
} from "@/lib/animations"
import { getInitials } from "@/lib/utils/format"

type ConnectStatus = "none" | "pending"

type Comment = {
  id: number
  name: string
  avatar: string
  text: string
  time: string
}

type SuggestedConnection = {
  id: number
  name: string
  headline: string
  initials: string
}

const SUGGESTED_CONNECTIONS: SuggestedConnection[] = [
  { id: 2, name: "Trần Hoàng", headline: "Product Manager @ VNG", initials: "TH" },
  { id: 3, name: "Lê Vy", headline: "Recruiter @ FPT Software", initials: "LV" },
]

const INITIAL_COMMENTS: Comment[] = [
  {
    id: 1,
    name: "Lê Vy",
    avatar: "LV",
    text: "Khóa học tuyệt vời quá! Chúc mừng anh nhé 🎉",
    time: "1 giờ trước",
  },
]

export default function HomeFeedPage() {
  const user = useCurrentUser()
  const userInitials = getInitials(user.displayName, "JL")

  const [isLiked, setIsLiked] = useState(false)
  const [connectStatuses, setConnectStatuses] = useState<
    Record<number, ConnectStatus>
  >({})

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isSendOpen, setIsSendOpen] = useState(false)
  const [isCommentOpen, setIsCommentOpen] = useState(false)

  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS)
  const [newComment, setNewComment] = useState("")

  function toggleConnect(id: number) {
    setConnectStatuses((prev) => ({
      ...prev,
      [id]: prev[id] === "pending" ? "none" : "pending",
    }))
  }

  function handlePostComment(event: React.FormEvent) {
    event.preventDefault()
    const text = newComment.trim()
    if (!text) return
    setComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: user.displayName,
        avatar: userInitials,
        text,
        time: "Vừa xong",
      },
    ])
    setNewComment("")
  }

  return (
    <motion.div
      variants={pageEntrance}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative"
    >
      <AnimatePresence>
        {isCreatePostOpen ? (
          <motion.div
            key="create-post-overlay"
            variants={modalOverlay}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsCreatePostOpen(false)}
          >
            <motion.div
              variants={modalContent}
              initial="hidden"
              animate="show"
              exit="exit"
              className="w-full max-w-lg bg-card border border-border/40 rounded-[24px] shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border/40">
                <h2 className="font-headline font-bold text-lg">Tạo bài viết</h2>
                <button
                  type="button"
                  onClick={() => setIsCreatePostOpen(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-10 h-10">
                    {user.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} />
                    ) : null}
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-sm">{user.displayName}</h3>
                    <span className="text-[11px] bg-muted px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1 font-medium text-muted-foreground">
                      <Globe className="w-3 h-3" /> Công khai
                    </span>
                  </div>
                </div>
                <textarea
                  autoFocus
                  placeholder="Bạn đang nghĩ gì?"
                  className="w-full min-h-[120px] bg-transparent border-none focus:ring-0 resize-none text-foreground placeholder:text-muted-foreground/70 outline-none"
                />
              </div>
              <div className="p-4 border-t border-border/40 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-xl transition-colors"
                  >
                    <BarChart2 className="w-5 h-5" />
                  </button>
                </div>
                <Button
                  onClick={() => setIsCreatePostOpen(false)}
                  className="px-6 rounded-xl font-semibold"
                >
                  Đăng
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isShareOpen ? (
          <motion.div
            key="share-overlay"
            variants={modalOverlay}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsShareOpen(false)}
          >
            <motion.div
              variants={modalContent}
              initial="hidden"
              animate="show"
              exit="exit"
              className="w-full max-w-sm bg-card border border-border/40 rounded-[24px] shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border/40">
                <h2 className="font-headline font-bold text-lg">Chia sẻ bài viết</h2>
                <button
                  type="button"
                  onClick={() => setIsShareOpen(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-2 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setIsShareOpen(false)}
                  className="flex items-center gap-3 w-full p-3 hover:bg-muted rounded-xl transition-colors text-left"
                >
                  <div className="p-2 bg-primary/10 text-primary rounded-full">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Chia sẻ lên Feed</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Chia sẻ ngay trên trang cá nhân của bạn
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareOpen(false)}
                  className="flex items-center gap-3 w-full p-3 hover:bg-muted rounded-xl transition-colors text-left"
                >
                  <div className="p-2 bg-muted text-foreground rounded-full">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Sao chép liên kết</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Sao chép URL bài viết để gửi
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isSendOpen ? (
          <motion.div
            key="send-overlay"
            variants={modalOverlay}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsSendOpen(false)}
          >
            <motion.div
              variants={modalContent}
              initial="hidden"
              animate="show"
              exit="exit"
              className="w-full max-w-sm bg-card border border-border/40 rounded-[24px] shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border/40">
                <h2 className="font-headline font-bold text-lg">Gửi qua tin nhắn</h2>
                <button
                  type="button"
                  onClick={() => setIsSendOpen(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 border-b border-border/40">
                <input
                  type="text"
                  placeholder="Tìm kiếm người để gửi..."
                  className="w-full bg-muted border border-border/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div className="p-2 max-h-60 overflow-y-auto">
                {SUGGESTED_CONNECTIONS.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{connection.initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold">
                        {connection.name}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs rounded-lg"
                      onClick={() => setIsSendOpen(false)}
                    >
                      Gửi
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.aside
        variants={slideLeft}
        initial="hidden"
        animate="show"
        className="hidden lg:block lg:col-span-3 space-y-4"
      >
        <Card className="overflow-hidden bg-card border-border/40 rounded-2xl">
          <div className="h-16 bg-gradient-to-r from-primary/80 to-blue-400" />
          <CardContent className="p-0">
            <div className="relative w-16 h-16 rounded-full border-[3px] border-card -mt-8 mx-auto overflow-hidden bg-muted">
              <Avatar className="w-full h-full">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : null}
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </div>

            <div className="text-center mt-2 border-b border-border/40 pb-4 px-4">
              <Link
                href="/profile/me"
                className="font-headline font-bold text-foreground text-lg hover:text-primary hover:underline transition-all"
              >
                {user.displayName}
              </Link>
              <p className="text-sm text-muted-foreground font-body mt-0.5">
                {user.role === "company"
                  ? "Trang doanh nghiệp"
                  : "Thành viên JobLink"}
              </p>
            </div>

            <div className="py-3 space-y-3 border-b border-border/40 px-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Lượt xem hồ sơ
                </span>
                <span className="text-xs font-semibold text-primary">—</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Kết nối</span>
                <span className="text-xs font-semibold text-primary">—</span>
              </div>
            </div>

            <div className="p-3">
              <Link
                href="/saved-jobs"
                className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted/50"
              >
                <Bookmark className="w-4 h-4 mr-2" /> Việc làm đã lưu
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/40 rounded-2xl p-4">
          <h3 className="text-sm font-headline font-bold text-foreground mb-4">
            Gợi ý kết nối
          </h3>
          <ul className="space-y-4">
            {SUGGESTED_CONNECTIONS.map((connection) => {
              const status = connectStatuses[connection.id] ?? "none"
              return (
                <li key={connection.id} className="flex items-center gap-3">
                  <Link href={`/profile/${connection.id}`}>
                    <Avatar className="w-10 h-10 border border-border/40 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarFallback>{connection.initials}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/profile/${connection.id}`}
                      className="text-sm font-semibold text-foreground truncate hover:text-primary hover:underline transition-colors block leading-tight"
                    >
                      {connection.name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {connection.headline}
                    </p>
                  </div>
                  <Button
                    variant={status === "pending" ? "secondary" : "outline"}
                    size="sm"
                    className={`h-8 rounded-full shrink-0 text-xs font-medium px-3 ${
                      status === "pending"
                        ? "text-foreground"
                        : "text-primary border-primary/40 hover:bg-primary/10"
                    }`}
                    onClick={() => toggleConnect(connection.id)}
                  >
                    {status === "pending" ? (
                      <>
                        <Check className="w-3 h-3 mr-1" /> Chờ xác nhận
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 mr-1" /> Kết nối
                      </>
                    )}
                  </Button>
                </li>
              )
            })}
          </ul>
        </Card>
      </motion.aside>

      <motion.div
        variants={staggerSm}
        initial="hidden"
        animate="show"
        className="col-span-1 lg:col-span-6 space-y-4"
      >
        <Card className="bg-card border-border/40 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-11 h-11 shrink-0 border border-border/40">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : null}
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => setIsCreatePostOpen(true)}
              className="flex-grow bg-muted/40 hover:bg-muted/80 transition-colors text-left rounded-full px-5 py-3 text-sm text-muted-foreground border border-border/20 focus:outline-none"
            >
              Bạn đang nghĩ gì, {user.displayName.split(" ").slice(-1)[0]}?
            </button>
          </div>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/30">
            <button
              type="button"
              onClick={() => setIsCreatePostOpen(true)}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ImageIcon className="text-blue-500 w-4 h-4" />{" "}
              <span className="text-[11px] sm:text-xs font-semibold">
                Ảnh/Video
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreatePostOpen(true)}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart2 className="text-orange-500 w-4 h-4" />{" "}
              <span className="text-[11px] sm:text-xs font-semibold">
                Bình chọn
              </span>
            </button>
            {user.role === "company" ? (
              <Link
                href="/company/post-job"
                className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Briefcase className="text-emerald-500 w-4 h-4" />{" "}
                <span className="text-[11px] sm:text-xs font-semibold">
                  Đăng tin
                </span>
              </Link>
            ) : null}
          </div>
        </Card>

        <div className="flex items-center gap-3 px-2 pt-1 pb-1">
          <Separator className="flex-grow shrink bg-border/40" />
          <span className="text-[11px] text-muted-foreground flex items-center cursor-pointer hover:text-foreground transition-colors whitespace-nowrap uppercase tracking-widest font-semibold">
            Mới nhất <ChevronDown className="w-3 h-3 ml-1" />
          </span>
        </div>

        <motion.div variants={fadeUp}>
          <Card className="bg-card border-border/40 rounded-2xl overflow-hidden">
            <div className="p-4 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Link href="/profile/1">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border border-border/40 hover:opacity-80 transition-opacity">
                      <AvatarFallback>TV</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link
                      href="/profile/1"
                      className="font-headline font-bold text-foreground text-[13px] sm:text-sm hover:text-primary hover:underline transition-colors leading-none mb-1 block"
                    >
                      Trần Văn A
                    </Link>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-none">
                      Lead Product Manager tại InnovateX
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center mt-1">
                      2 giờ trước <span className="mx-1">•</span>{" "}
                      <Globe className="w-3 h-3" />
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 text-[13px] sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line font-body">
                Rất vui mừng được chia sẻ rằng tôi vừa hoàn thành khóa học
                &quot;Advanced UX Strategy&quot; từ Nielsen Norman Group! 🎉
                {"\n\n"}
                Khóa học đã cung cấp những insight tuyệt vời về cách xây dựng
                chiến lược trải nghiệm người dùng tích hợp chặt chẽ với mục tiêu
                kinh doanh.
                {"\n\n"}
                <span className="text-primary hover:underline cursor-pointer">
                  #UXDesign
                </span>{" "}
                <span className="text-primary hover:underline cursor-pointer">
                  #ProductManagement
                </span>
              </div>
            </div>

            <div className="w-full aspect-video bg-muted border-y border-border/20 flex items-center justify-center">
              <span className="text-muted-foreground font-semibold">
                Image Placeholder: Certificate
              </span>
            </div>

            <div className="px-3 sm:px-4 py-3 border-b border-border/30 flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground">
              <div className="flex items-center gap-1 cursor-pointer hover:text-primary">
                <div className="bg-blue-500 rounded-full p-0.5 flex items-center justify-center">
                  <ThumbsUp className="w-3 h-3 text-white fill-white" />
                </div>
                <span className="ml-1 text-foreground/80 font-medium">
                  {isLiked ? 129 : 128}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="hover:text-primary hover:underline"
                  onClick={() => setIsCommentOpen((v) => !v)}
                >
                  {comments.length} bình luận
                </button>
                <button
                  type="button"
                  className="hover:text-primary hover:underline"
                  onClick={() => setIsShareOpen(true)}
                >
                  5 chia sẻ
                </button>
              </div>
            </div>

            <div className="px-1 sm:px-2 py-1 flex items-center justify-between">
              <motion.button
                {...btnTap}
                type="button"
                onClick={() => setIsLiked((v) => !v)}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg transition-colors font-semibold text-[11px] sm:text-[13px] ${
                  isLiked
                    ? "text-primary hover:bg-primary/10"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <ThumbsUp
                  className={`w-4 h-4 ${isLiked ? "fill-primary" : ""}`}
                />
                <span className="hidden sm:inline">Thích</span>
              </motion.button>
              <motion.button
                {...btnTap}
                type="button"
                onClick={() => setIsCommentOpen((v) => !v)}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-semibold text-[11px] sm:text-[13px]"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Bình luận</span>
              </motion.button>
              <motion.button
                {...btnTap}
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-semibold text-[11px] sm:text-[13px]"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Chia sẻ</span>
              </motion.button>
              <motion.button
                {...btnTap}
                type="button"
                onClick={() => setIsSendOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-semibold text-[11px] sm:text-[13px]"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Gửi</span>
              </motion.button>
            </div>

            {isCommentOpen ? (
              <div className="p-4 bg-muted/10 border-t border-border/30 animate-in slide-in-from-top-2">
                <form onSubmit={handlePostComment} className="flex gap-3 mb-6">
                  <Avatar className="w-8 h-8">
                    {user.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} />
                    ) : null}
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex items-center bg-transparent border border-border/60 rounded-full px-4 bg-card focus-within:border-primary transition-colors">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(event) => setNewComment(event.target.value)}
                      placeholder="Viết bình luận..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] py-2 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="text-primary disabled:opacity-50 p-1"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{comment.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted border border-border/40 rounded-2xl px-4 py-2 inline-block">
                          <h4 className="font-semibold text-[13px] hover:underline hover:text-primary">
                            {comment.name}
                          </h4>
                          <p className="text-[13px] text-foreground/90 mt-0.5">
                            {comment.text}
                          </p>
                        </div>
                        <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground font-semibold ml-2">
                          <span className="cursor-pointer hover:text-foreground">
                            Thích
                          </span>
                          <span className="cursor-pointer hover:text-foreground">
                            Phản hồi
                          </span>
                          <span className="font-normal">{comment.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </motion.div>
      </motion.div>

      <motion.aside
        variants={slideRight}
        initial="hidden"
        animate="show"
        className="col-span-1 lg:col-span-3 space-y-4"
      >
        <Card className="bg-card border-border/40 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
            <h3 className="text-[12px] font-bold text-foreground uppercase tracking-widest">
              Việc làm gợi ý
            </h3>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/50 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/jobs/1"
              className="border border-border/40 rounded-xl p-3 hover:border-primary/40 hover:bg-muted/20 transition-all cursor-pointer group bg-card block"
            >
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center border border-border/40 overflow-hidden group-hover:bg-primary/5 transition-colors">
                  <Building2 className="text-primary w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-headline font-bold text-foreground text-[13px] truncate group-hover:text-primary transition-colors">
                    Senior Frontend
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Global Tech Solutions
                  </p>
                </div>
              </div>
            </Link>
          </div>
          <Link href="/jobs" className="flex">
            <Button
              variant="ghost"
              className="w-full mt-3 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg"
            >
              Xem tất cả
            </Button>
          </Link>
        </Card>
      </motion.aside>
    </motion.div>
  )
}
