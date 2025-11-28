// spg-web/src/services/FileStorageService.ts
import api from "./api";

// URL do microserviço de FileStorage (porta 3008, conforme sua configuração)
const FILE_UPLOAD_ENDPOINT = "/files/upload";

/**
 * Envia uma imagem para o microserviço de FileStorage.
 * O FileStorage espera um campo 'file' no formulário (upload.single('file')).
 * @param file O objeto File a ser enviado.
 * @returns O path da imagem no servidor (ex: /files/nome-do-arquivo.png) em caso de sucesso.
 */
export async function uploadImage(token: string, file: File): Promise<{ success: boolean, imagePaths?: string, msg?: string }> {
    try {
        const formData = new FormData();
        // 'file' é o nome do campo esperado pelo Multer no FileStorage
        formData.append('file', file); 

        // ✅ Uso da instância 'api' (Gateway) e token no Header
        const result = await api.post(FILE_UPLOAD_ENDPOINT, formData, {
            headers: { 
                Authorization: `Bearer ${token}`, 
                // Não precisamos definir 'Content-Type': 'multipart/form-data', o Axios faz isso automaticamente com FormData, 
                // mas podemos deixar para clareza:
                // 'Content-Type': 'multipart/form-data', 
            },
        });

        // O endpoint de upload retorna { file: { path: '/files/nome-do-arquivo.png' } }
        return { 
            success: true, 
            imagePaths: result.data.file.filename, // O FileStorage retorna apenas o nome do arquivo para o path.
            msg: result.data.msg
        };
    } catch (error) {
        console.error("[FileStorageService] Erro ao fazer upload do arquivo:", error);
        // @ts-ignore
        const errorMessage = error.response?.data?.error || error.message || "Erro desconhecido ao enviar arquivo.";
        return { 
            success: false, 
            msg: `Falha no upload: ${errorMessage}` 
        };
    }
}
