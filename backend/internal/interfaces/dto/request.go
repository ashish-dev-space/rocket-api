package dto

type CreateCollectionRequest struct {
	Name string `json:"name"`
}

type CreateFileRequest struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

type UpdateFileRequest struct {
	Content string `json:"content"`
}

type CreateFolderRequest struct {
	Path string `json:"path"`
}
