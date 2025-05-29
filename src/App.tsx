import { useState, useEffect } from "react";

// Add type definitions for File System Access API
interface FileSystemFileHandle {
  getFile: () => Promise<File>;
  name: string;
}

export default function App() {
  const [formattedOutput, setFormattedOutput] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [fileCount, setFileCount] = useState(0);

  const handleFilePick = async () => {
    try {
      // Use proper typing for File System Access API
      const handles = await (
        window as unknown as {
          showOpenFilePicker: (options: {
            multiple: boolean;
          }) => Promise<FileSystemFileHandle[]>;
        }
      ).showOpenFilePicker({
        multiple: true,
      });

      setFileCount(handles.length);
      const filesData: { name: string; content: string }[] = [];

      for (const handle of handles) {
        const file = await handle.getFile();
        const text = await file.text();
        filesData.push({ name: handle.name, content: text });
      }

      // Always format as markdown now
      formatAsCombined(filesData);
    } catch (err) {
      console.error("File selection cancelled or failed", err);
    }
  };

  // Format files using the markdown style with better spacing
  const formatAsCombined = (files: { name: string; content: string }[]) => {
    // Start with a clear title
    let combinedContent = "# Files combined:\n\n";

    // Create a clean list of files
    files.forEach((file) => {
      combinedContent += `- \`${file.name}\`\n`;
    });

    // Add two blank lines after the file list for better readability
    combinedContent += "\n\n";

    // Add the actual content with markdown code blocks and clear file headers
    files.forEach((file, index) => {
      const extension = file.name.split(".").pop() || "";

      // Add separators between files (except before the first one)
      if (index > 0) {
        combinedContent += "---\n\n";
      }

      // Format with a header and code block
      combinedContent += `### ${
        file.name
      }\n\n\`\`\`${extension}\n${file.content.trimEnd()}\n\`\`\`\n\n`;
    });

    setFormattedOutput(combinedContent.trim());
  };

  // Reset all states to initial values
  const resetStates = () => {
    setFormattedOutput("");
    setFileCount(0);
    setIsExpanded(false);
  };

  const injectIntoChatGPT = () => {
    const prosemirrorDiv = document.querySelector(
      ".ProseMirror"
    ) as HTMLElement;

    if (!prosemirrorDiv) {
      alert("ChatGPT input field not found.");
      return;
    }

    prosemirrorDiv.focus();

    // Use a single, reliable injection method
    try {
      // First try the modern approach with execCommand
      if (document.queryCommandSupported("insertText")) {
        document.execCommand("insertText", false, formattedOutput);
      } else {
        // Fallback to range insertion if execCommand is not supported
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(formattedOutput);
          range.insertNode(textNode);

          // Move cursor to end of inserted text
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    } catch (e) {
      console.warn("Standard insertion failed, trying alternative method", e);

      // Last resort: try to find and set textarea value directly
      const textarea = document.querySelector(
        'textarea[data-id="root"]'
      ) as HTMLTextAreaElement;
      if (textarea) {
        const oldValue = textarea.value;
        textarea.value = oldValue + formattedOutput;

        // Trigger input event to ensure ChatGPT recognizes the change
        const event = new Event("input", { bubbles: true });
        textarea.dispatchEvent(event);
      } else {
        // Final fallback
        alert("Could not inject text. Try copying and pasting manually.");
        console.error("Injection failed", e);
      }
    }

    // Reset all states after injection
    resetStates();
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(formattedOutput)
      .then(() => {
        // Show a brief visual feedback
        const copyBtn = document.getElementById("copy-btn");
        if (copyBtn) {
          const originalText = copyBtn.innerText;
          copyBtn.innerText = "Copied!";
          setTimeout(() => {
            copyBtn.innerText = originalText;
          }, 2000);
        }
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        alert("Failed to copy to clipboard. Please try again.");
      });
  };

  // Function to toggle expanded state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Position the tool near the ChatGPT textarea
  useEffect(() => {
    const positionTool = () => {
      const chatInput = document.querySelector(".ProseMirror") as HTMLElement;
      const toolContainer = document.getElementById(
        "git-paste-container"
      ) as HTMLElement;

      if (chatInput && toolContainer) {
        const chatInputRect = chatInput.getBoundingClientRect();

        // Position above the textarea
        toolContainer.style.position = "fixed";
        toolContainer.style.left = `${chatInputRect.left}px`;
        toolContainer.style.bottom = `${
          window.innerHeight - chatInputRect.top + 20
        }px`;
      }
    };

    // Position initially and on window resize
    positionTool();
    window.addEventListener("resize", positionTool);

    // Re-position when input area might change (e.g., when switching chats)
    const observer = new MutationObserver(positionTool);
    const targetNode = document.querySelector("body");
    if (targetNode) {
      observer.observe(targetNode, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener("resize", positionTool);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      id="git-paste-container"
      style={{
        background: "white",
        padding: "12px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
        width: "728px",
        fontFamily: "sans-serif",
        zIndex: 9999,
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: isExpanded ? "column" : "row",
        alignItems: "center",
        border: "1px solid #e5e5e5",
      }}
    >
      {!isExpanded ? (
        <button
          onClick={toggleExpand}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "4px 8px",
            borderRadius: "4px",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          <span style={{ marginLeft: "4px" }}>Git Paste</span>
        </button>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              marginBottom: "12px",
            }}
          >
            <h3 style={{ margin: 0 }}>Git Paste</h3>
            <button
              onClick={toggleExpand}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                onClick={handleFilePick}
                style={{
                  padding: "10px 16px",
                  background: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                  width: "100%",
                }}
              >
                Select Files
              </button>
            </div>

            {fileCount > 0 && (
              <div
                style={{
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ marginRight: "8px" }}
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>
                  {fileCount} file{fileCount !== 1 ? "s" : ""} selected
                  (Markdown format)
                </span>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={injectIntoChatGPT}
                disabled={!formattedOutput}
                style={{
                  flex: "1",
                  padding: "10px 16px",
                  background: formattedOutput ? "#10a37f" : "#d1d5db",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: formattedOutput ? "pointer" : "not-allowed",
                  fontWeight: "500",
                }}
              >
                Inject Files
              </button>

              <button
                id="copy-btn"
                onClick={copyToClipboard}
                disabled={!formattedOutput}
                style={{
                  padding: "10px 16px",
                  background: formattedOutput ? "#4b5563" : "#d1d5db",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: formattedOutput ? "pointer" : "not-allowed",
                }}
              >
                Copy
              </button>
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#666",
                backgroundColor: "#f9fafb",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #e5e5e5",
              }}
            >
              <strong>Note:</strong> To select files from different folders,
              select them one at a time and use multiple injections, or use Copy
              to merge manually.
            </div>

            {formattedOutput && (
              <div
                style={{
                  marginTop: "12px",
                  maxHeight: "300px",
                  overflow: "auto",
                  border: "1px solid #e5e5e5",
                  borderRadius: "4px",
                  padding: "8px",
                  backgroundColor: "#f9fafb",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                  Preview:
                </div>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: "250px",
                    overflow: "auto",
                  }}
                >
                  {formattedOutput.length > 1000
                    ? formattedOutput.slice(0, 1000) + "..."
                    : formattedOutput}
                </pre>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
