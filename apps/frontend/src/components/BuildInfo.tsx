const BUILD_TIME_LABEL = new Date(__BUILD_TIME__).toLocaleString('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Version + build time line for footers, so users can tell how fresh the deploy is. */
export default function BuildInfo() {
  return (
    <p className="m-0 mt-1.5 text-[10px] text-slate-600">
      Phiên bản v{__APP_VERSION__} · build <span className="font-mono">{__COMMIT_HASH__}</span> · cập nhật lúc {BUILD_TIME_LABEL}
    </p>
  );
}
