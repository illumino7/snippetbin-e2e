package s3

import (
	"context"
	"time"

	"github.com/minio/minio-go/v7"
)

type MinioSnippetStorage struct {
	client *minio.Client
	bucket string
}

func (m *MinioSnippetStorage) GetPresignedURL(ctx context.Context, objectID string, expiry time.Duration) (string, error) {
	presignedURL, err := m.client.PresignedGetObject(ctx, m.bucket, objectID, expiry, nil)
	if err != nil {
		return "", err
	}
	return presignedURL.String(), nil
}

func (m *MinioSnippetStorage) PutPresignedURL(ctx context.Context, objectID string, expiry time.Duration) (string, error) {
	presignedURL, err := m.client.PresignedPutObject(ctx, m.bucket, objectID, expiry)
	if err != nil {
		return "", err
	}
	return presignedURL.String(), nil
}

func (m *MinioSnippetStorage) ObjectExists(ctx context.Context, objectID string) (bool, error) {
	_, err := m.client.StatObject(ctx, m.bucket, objectID, minio.StatObjectOptions{})
	if err != nil {
		errResponse := minio.ToErrorResponse(err)
		if errResponse.Code == "NoSuchKey" || errResponse.StatusCode == 404 {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func NewMinioStorage(client *minio.Client, bucket string) Storage {
	return Storage{
		Snippet: &MinioSnippetStorage{
			client: client,
			bucket: bucket,
		},
	}
}
