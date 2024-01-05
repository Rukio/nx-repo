TARGET_FILES = \
	legacy-conceptual.dot.svg \
	legacy-systems.dot.svg \
	target.dot.svg \
	service-architecture.dot.svg


.PHONY: all

all: $(TARGET_FILES)

%.dot.svg: %.dot
	dot -Tsvg $< -o $@
