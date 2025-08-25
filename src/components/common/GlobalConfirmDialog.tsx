import { useConfirm } from "@/hooks/useConfirm"


import { useConfirmStore } from "@/store/useConfirmStore";
import { ConfirmDialog } from "./ConfirmDialogComp";

export function GlobalConfirmDialog() {
  const {
    isOpen,
    title,
    message,
    okText,
    cancelText,
    variant,
    onConfirm,
    onCancel,
    closeConfirm,
  } = useConfirmStore();

  if (!isOpen) {
    return null;
  }

  return (
    <ConfirmDialog
      open={isOpen}
      title={title}
      message={message}
      okText={okText}
      cancelText={cancelText}
      variant={variant}
      onConfirm={onConfirm}
      onCancel={onCancel}
      onClose={closeConfirm} // 当对话框关闭时（例如点击外部），调用 onCancel 的逻辑
    />
  );
}

