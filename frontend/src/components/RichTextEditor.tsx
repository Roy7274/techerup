'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { message } from 'antd'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  height?: number
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容...',
  height = 400,
}: RichTextEditorProps) {
  const quillRef = useRef<any>(null)

  // 图片上传处理
  const imageHandler = () => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      // 检查文件大小 (限制5MB)
      if (file.size > 5 * 1024 * 1024) {
        message.error('图片大小不能超过5MB')
        return
      }

      try {
        // 上传图片
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_URL}/api/articles/upload-image`, {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        const data = await response.json()

        if (data.success) {
          const imageUrl = data.url.startsWith('http')
            ? data.url
            : `${API_URL}${data.url}`

          // 插入图片到编辑器
          const quill = quillRef.current?.getEditor()
          if (quill) {
            const range = quill.getSelection()
            quill.insertEmbed(range?.index || 0, 'image', imageUrl)
          }
          message.success('图片上传成功')
        } else {
          message.error('图片上传失败')
        }
      } catch (error) {
        console.error('图片上传失败:', error)
        message.error('图片上传失败，请重试')
      }
    }
  }

  // 上传粘贴的图片
  const uploadPastedImage = async (file: File) => {
    // 检查文件大小
    if (file.size > 5 * 1024 * 1024) {
      message.error('图片大小不能超过5MB')
      return
    }

    try {
      console.log('开始上传图片到:', `${API_URL}/api/articles/upload-image`)
      message.loading('正在上传图片...', 0)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_URL}/api/articles/upload-image`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      console.log('上传响应状态:', response.status)
      message.destroy()
      const data = await response.json()
      console.log('上传响应数据:', data)

      if (data.success) {
        const imageUrl = data.url.startsWith('http')
          ? data.url
          : `${API_URL}${data.url}`

        console.log('图片URL:', imageUrl)

        // 插入图片到编辑器
        const quill = quillRef.current?.getEditor()
        if (quill) {
          const range = quill.getSelection() || { index: 0 }
          console.log('插入图片到位置:', range.index)
          quill.insertEmbed(range.index, 'image', imageUrl)
          // 移动光标到图片后面
          quill.setSelection(range.index + 1, 0)
        }
        message.success('图片上传成功')
      } else {
        console.error('上传失败，响应数据:', data)
        message.error('图片上传失败')
      }
    } catch (error) {
      message.destroy()
      console.error('图片上传失败:', error)
      message.error('图片上传失败，请重试')
    }
  }

  // 监听编辑器的粘贴事件
  useEffect(() => {
    let cleanupFn: (() => void) | null = null

    // 需要延迟一下以确保编辑器已经初始化
    const timer = setTimeout(() => {
      const editor = quillRef.current?.getEditor()
      if (!editor) return

      const container = editor.root
      
      const handlePaste = (event: ClipboardEvent) => {
        const clipboard = event.clipboardData
        if (!clipboard) return

        const items = clipboard.items
        console.log('粘贴事件触发，剪贴板项数量:', items.length)

        // 检查所有剪贴板项
        let hasImageFile = false
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          console.log(`剪贴板项 ${i}: 类型=${item.type}`)
          
          // 检查是否是图片文件
          if (item.type.indexOf('image') !== -1) {
            hasImageFile = true
            console.log('检测到图片文件，准备上传...')
            // 阻止默认行为，防止Quill插入本地文件路径
            event.preventDefault()
            event.stopPropagation()
            event.stopImmediatePropagation()
            
            const file = item.getAsFile()
            if (file) {
              console.log('获取到文件:', file.name || 'image', file.size, 'bytes')
              uploadPastedImage(file)
            }
            break
          }
        }

        // 如果没有图片文件，检查是否有HTML包含本地图片路径
        if (!hasImageFile) {
          const htmlData = clipboard.getData('text/html')
          if (htmlData && htmlData.includes('file://')) {
            console.log('检测到本地文件路径HTML，阻止粘贴')
            event.preventDefault()
            event.stopPropagation()
            event.stopImmediatePropagation()
            message.warning('请直接复制图片文件，而不是图片的路径')
          }
        }
      }

      // 使用capture模式确保我们的处理器优先执行
      container.addEventListener('paste', handlePaste, true)

      cleanupFn = () => {
        container.removeEventListener('paste', handlePaste, true)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      if (cleanupFn) {
        cleanupFn()
      }
    }
  }, [])

  // Quill编辑器配置
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ font: [] }],
          [{ size: ['small', false, 'large', 'huge'] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ script: 'sub' }, { script: 'super' }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ align: [] }],
          ['blockquote', 'code-block'],
          ['link', 'image', 'video'],
          ['clean'],
        ],
        handlers: {
          image: imageHandler,
        },
      },
      clipboard: {
        matchVisual: false,
        matchers: [
          // 拦截所有图片粘贴，防止本地文件路径被插入
          ['IMG', (node: any, delta: any) => {
            console.log('拦截IMG标签粘贴:', node.src)
            // 如果是本地文件路径，阻止插入
            if (node.src && node.src.startsWith('file://')) {
              console.log('阻止本地文件路径插入')
              return { ops: [] }
            }
            return delta
          }],
        ],
      },
    }),
    []
  )

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'script',
    'list',
    'bullet',
    'indent',
    'align',
    'blockquote',
    'code-block',
    'link',
    'image',
    'video',
  ]

  return (
    <div className="rich-text-editor">
      <ReactQuill
        {...({ ref: quillRef } as any)}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ height: `${height}px`, marginBottom: '42px' }}
      />
      <style jsx global>{`
        .rich-text-editor .quill {
          background: white;
          border-radius: 8px;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          border: 1px solid #d9d9d9;
          background: #fafafa;
        }
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          border: 1px solid #d9d9d9;
          border-top: none;
          font-size: 14px;
        }
        .rich-text-editor .ql-editor {
          min-height: ${height}px;
          max-height: 600px;
          overflow-y: auto;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #bfbfbf;
          font-style: normal;
        }
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}

