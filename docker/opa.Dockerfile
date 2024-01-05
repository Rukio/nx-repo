FROM openpolicyagent/opa:0.50.1-static

ARG BUNDLE

EXPOSE 8181

COPY ${BUNDLE} /bundle

ENTRYPOINT ["opa", "run", "--server", "--addr", ":8181", "-b", "/bundle", "--authorization", "basic"]
