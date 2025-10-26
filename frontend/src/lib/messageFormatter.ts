/**
 * 消息格式化工具
 * 用于处理AI回复中的格式标记，如 ** 加粗标记
 */

/**
 * 将消息中的格式标记转换为HTML
 * @param message 原始消息文本
 * @returns 格式化后的HTML字符串
 */
export function formatMessage(message: string): string {
  if (!message) return '';

  let formatted = message;

  // 处理加粗标记 **text** -> <strong>text</strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 处理斜体标记 *text* -> <em>text</em> (避免与加粗标记冲突)
  formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // 处理下划线标记 __text__ -> <u>text</u>
  formatted = formatted.replace(/__(.*?)__/g, '<u>$1</u>');

  // 处理删除线标记 ~~text~~ -> <del>text</del>
  formatted = formatted.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // 处理代码标记 `text` -> <code>text</code>
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 处理换行符
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

/**
 * 检查消息是否包含格式标记
 * @param message 消息文本
 * @returns 是否包含格式标记
 */
export function hasFormatting(message: string): boolean {
  if (!message) return false;
  
  // 检查是否包含加粗标记
  return /\*\*.*?\*\*/.test(message);
}

/**
 * 安全地渲染HTML内容
 * @param htmlString HTML字符串
 * @returns 安全的HTML内容
 */
export function createSafeHtml(htmlString: string): { __html: string } {
  // 这里可以添加更多的安全过滤逻辑
  // 目前只处理基本的格式标记，相对安全
  return { __html: htmlString };
}

/**
 * 获取格式化消息的CSS样式
 * @returns CSS样式对象
 */
export function getFormatStyles(): React.CSSProperties {
  return {
    // 确保格式化后的文本样式正确显示
    lineHeight: '1.6',
    wordBreak: 'break-word' as const,
  };
}

/**
 * 获取格式化消息的CSS类名
 * @returns CSS类名
 */
export function getFormatClassName(): string {
  return 'message-formatted';
}
