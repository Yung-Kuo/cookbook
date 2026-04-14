"use client";

export default function SplitPageLayout({ leftPanel, rightPanel = null, overlay = null }) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-neutral-800 text-4xl text-neutral-100">
      {rightPanel != null ? (
        <>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            <div className="hidden h-full min-h-0 w-full flex-col overflow-hidden border-neutral-700 lg:flex lg:w-2/5 lg:border-r">
              <div className="flex h-full min-h-0 w-full flex-col overflow-hidden lg:pt-14">
                {leftPanel}
              </div>
            </div>

            <div className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden lg:w-3/5">
              <div
                className={`flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain ${overlay != null ? "lg:invisible" : ""}`}
                aria-hidden={overlay != null ? true : undefined}
              >
                {rightPanel}
              </div>
              {overlay != null && (
                <div className="absolute inset-0 hidden min-h-0 flex-col bg-neutral-800 lg:flex">
                  {overlay}
                </div>
              )}
            </div>
          </div>

          {overlay != null && (
            <div className="fixed inset-0 min-h-0 lg:hidden">{overlay}</div>
          )}
        </>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            <div className="flex h-full min-h-0 w-full flex-col overflow-hidden lg:w-2/5 lg:pt-14">
              {leftPanel}
            </div>

            {overlay != null && (
              <div className="relative hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex lg:w-3/5">
                <div className="absolute inset-0 flex min-h-0 flex-col bg-neutral-800">
                  {overlay}
                </div>
              </div>
            )}
          </div>

          {overlay != null && (
            <div className="fixed inset-0 min-h-0 lg:hidden">{overlay}</div>
          )}
        </>
      )}
    </div>
  );
}
