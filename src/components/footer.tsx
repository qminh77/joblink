export async function Footer() {
  return (
    <footer className="border-t border-border/30 bg-background mt-auto">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-10">
        <div className="grid sm:grid-cols-1 gap-8">
          <div className="space-y-3 text-center">
            <h3 className="font-bold text-lg">Joblink</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Nền tảng kết nối việc làm và tuyển dụng hàng đầu Việt Nam.
            </p>
          </div>
        </div>

        <div className="border-t border-border/20 mt-8 pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Joblink. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
