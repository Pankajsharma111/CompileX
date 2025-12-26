const FilePreview = ({ file }) => {
  if (!file || !file.url) return null;

  // IMAGE PREVIEW
  if (file.mimeType?.startsWith("image/")) {
    return (
      <img
        src={file.url}
        alt={file.originalName}
        className="w-full max-w-md rounded-xl shadow"
      />
    );
  }

  //  PDF PREVIEW
  if (file.mimeType === "application/pdf") {
    return (
      <iframe
        src={file.url}
        title={file.originalName}
        className="w-full h-[500px] rounded-xl border"
      />
    );
  }

  //  OTHER FILES
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 underline"
    >
      Download {file.originalName}
    </a>
  );
};

export default FilePreview;
