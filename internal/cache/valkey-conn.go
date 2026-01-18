package cache

import (
	glide "github.com/valkey-io/valkey-glide/go/v2"
	"github.com/valkey-io/valkey-glide/go/v2/config"
)

func NewValkeyConn(addr string, port int) (*glide.Client, error) {
	standaloneConfig := config.NewClientConfiguration().WithAddress(&config.NodeAddress{
		Host: addr,
		Port: port,
	})
	client, err := glide.NewClient(standaloneConfig)
	if err != nil {
		return nil, err
	}
	return client, nil
}
