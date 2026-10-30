FROM docker:28-cli AS docker-cli
FROM python:3.13-slim
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker-cli /usr/local/libexec/docker/cli-plugins/docker-compose /usr/local/libexec/docker/cli-plugins/docker-compose
COPY scripts/catalog-transfer-host.py /usr/local/bin/catalog-transfer-host.py
CMD ["python3", "/usr/local/bin/catalog-transfer-host.py"]
