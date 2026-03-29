import type { IpcMain } from 'electron'
import { dialog } from 'electron'
import { promises as fs } from 'fs'
import { basename, extname } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { IPC } from '../../shared/constants'
import type { IPCResponse, RagFileEntry } from '../../shared/ipc-types'
import { indexRawText, deleteFileFromIndex, logToFile } from '../services/rag.service'
import { listRagFiles, addRagFile, removeRagFile } from '../services/rag-files.service'
import { getSettings } from '../services/settings.service'

function getActiveCreds(): { apiKey: string; baseURL: string } | null {
  const settings = getSettings()
  const provider =
    settings.aiProviders.find((p) => p.id === settings.activeProviderId) ||
    settings.aiProviders.find((p) => p.isDefault) ||
    settings.aiProviders[0]
  if (!provider?.apiKey || provider.apiKey.trim() === '') return null
  return { apiKey: provider.apiKey, baseURL: provider.baseURL }
}

async function extractText(filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.pdf') {
    // Lazy import to avoid startup cost
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParseModule = require('pdf-parse')
    // pdf-parse exports the function as PDFParse property (a class)
    const PDFParse = pdfParseModule.PDFParse
    const buf = await fs.readFile(filePath)
    const instance = new PDFParse({ data: buf })
    const result = await instance.getText()
    await logToFile(`EXTRACT PDF: file="${filePath}", pages=${result.total}, length=${result.text?.length || 0}`)
    return result.text
  }
  // TXT / MD / others — read as-is
  const text = await fs.readFile(filePath, 'utf-8')
  await logToFile(`EXTRACT TEXT: file="${filePath}", length=${text.length}`)
  return text
}

export function registerRagFilesHandlers(ipcMain: IpcMain): void {
  /**
   * rag:list-files — list uploaded files for a notebook (or all if no notebookId).
   */
  ipcMain.handle(
    IPC.RAG_LIST_FILES,
    async (_event, notebookId?: string): Promise<IPCResponse<RagFileEntry[]>> => {
      try {
        const files = await listRagFiles(notebookId)
        return { success: true, data: files }
      } catch (e) {
        return { success: false, error: String(e) }
      }
    }
  )

  /**
   * rag:upload-file — open file picker, parse, chunk, index.
   */
  ipcMain.handle(
    IPC.RAG_UPLOAD_FILE,
    async (_event, notebookId: string): Promise<IPCResponse<RagFileEntry>> => {
      try {
        const result = await dialog.showOpenDialog({
          title: '选择要上传到知识库的文件',
          filters: [
            { name: '支持的文件', extensions: ['pdf', 'txt', 'md'] },
          ],
          properties: ['openFile'],
        })
        if (result.canceled || result.filePaths.length === 0) {
          return { success: false, error: 'cancelled' }
        }

        const filePath = result.filePaths[0]
        const fileName = basename(filePath)
        const ext = extname(filePath).toLowerCase().replace('.', '') as 'pdf' | 'txt' | 'md'
        const stat = await fs.stat(filePath)

        // Step 1: Parse file locally (no API key needed)
        const text = await extractText(filePath)
        const fileId = uuidv4()

        // Step 2: Check API key only when creating embeddings
        const creds = getActiveCreds()
        if (!creds) {
          return { 
            success: false, 
            error: '未配置 API Key，无法创建知识索引。请在设置中配置 AI Provider。' 
          }
        }

        // Step 3: Create embeddings and index
        const chunkCount = await indexRawText(fileId, fileName, text, creds.apiKey, creds.baseURL)

        const entry: RagFileEntry = {
          id: fileId,
          notebookId,
          fileName,
          fileType: ext,
          fileSizeBytes: stat.size,
          uploadedAt: new Date().toISOString(),
          chunkCount,
        }
        await addRagFile(entry)

        return { success: true, data: entry }
      } catch (e) {
        console.error('[RAG Files IPC] upload-file error:', e)
        return { success: false, error: String(e) }
      }
    }
  )

  /**
   * rag:delete-file — remove chunks from index and metadata.
   */
  ipcMain.handle(
    IPC.RAG_DELETE_FILE,
    async (_event, fileId: string): Promise<IPCResponse> => {
      try {
        const creds = getActiveCreds()
        if (creds) {
          await deleteFileFromIndex(fileId, creds.apiKey, creds.baseURL)
        }
        await removeRagFile(fileId)
        return { success: true }
      } catch (e) {
        console.error('[RAG Files IPC] delete-file error:', e)
        return { success: false, error: String(e) }
      }
    }
  )
}
