package main

import (
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func NewS3Conn(s3config s3Config) (*minio.Client, error) {
	client, err := minio.New(s3config.endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(s3config.accessKey, s3config.secretKey, ""),
		Secure: s3config.useSSL,
	})
	if err != nil {
		return nil, err
	}

	return client, nil
}
