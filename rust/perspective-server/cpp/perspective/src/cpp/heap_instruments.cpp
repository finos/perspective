// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

#include "perspective/base.h"
#include "perspective/heap_instruments.h"
#include <cstddef>
#include <cstdio>
#include <cstdlib>
#include <emscripten/emscripten.h>
#include <emscripten/heap.h>
#include <emscripten/em_asm.h>
#include <emscripten/stack.h>
#include <string>

static std::uint64_t USED_MEMORY = 0;

static constexpr std::uint64_t MIN_RELEVANT_SIZE = 5 * 1024 * 1024;

extern "C" void
psp_print_used_memory() {
    printf("Used memory: %llu\n", USED_MEMORY);
}

struct Header {
    std::uint64_t size;
};

using UnderlyingString =
    std::basic_string<char, std::char_traits<char>, UnderlyingAllocator<char>>;

using UnderlyingIStringStream = std::basic_istringstream<
    char,
    std::char_traits<char>,
    UnderlyingAllocator<char>>;

struct AllocMeta {
    Header header;
    const UnderlyingString* trace;
    std::uint64_t size;
};

static std::unordered_map<
    UnderlyingString,
    AllocMeta,
    std::hash<UnderlyingString>,
    std::equal_to<>,
    UnderlyingAllocator<std::pair<UnderlyingString const, AllocMeta>>>
    stack_traces;

static UnderlyingString IRRELEVANT = "irrelevant";

static inline void
record_stack_trace(Header* header, std::uint64_t size) {
    if (size >= MIN_RELEVANT_SIZE) {
        const char* stack_c_str = perspective::psp_stack_trace();
        UnderlyingIStringStream stack(stack_c_str);
        UnderlyingString line;
        UnderlyingString out;

        while (std::getline(stack, line)) {
            line = line.substr(0, line.find_last_of(" ("));
            out += line + "\n";
        }

        emscripten_builtin_free(const_cast<char*>(stack_c_str));

        // stack_traces[ptr] = {.header = *header, .trace = out};
        if (stack_traces.find(out) == stack_traces.end()) {
            stack_traces[out] =
                AllocMeta{.header = *header, .trace = nullptr, .size = size};

            stack_traces[out].trace = &stack_traces.find(out)->first;
        } else {
            stack_traces[out].size += size;
        }
    } else {
        if (stack_traces.find(IRRELEVANT) == stack_traces.end()) {
            stack_traces[IRRELEVANT] = AllocMeta{
                .header = *header, .trace = &IRRELEVANT, .size = size
            };
        } else {
            stack_traces[IRRELEVANT].size += size;
        }
    }
}

extern "C" void
psp_dump_stack_traces() {
    std::vector<AllocMeta, UnderlyingAllocator<AllocMeta>> metas;
    metas.reserve(stack_traces.size());
    for (const auto& [_, meta] : stack_traces) {
        metas.push_back(meta);
    }
    std::sort(
        metas.begin(),
        metas.end(),
        [](const AllocMeta& a, const AllocMeta& b) {
            return a.header.size > b.header.size;
        }
    );
    for (const auto& meta : metas) {
        printf("Allocated %llu bytes\n", meta.header.size);
        printf("Stacktrace:\n%s\n", meta.trace->c_str());
    }
}

extern "C" void
psp_clear_stack_traces() {
    stack_traces.clear();
}

void*
malloc(size_t size) {
    if (size > MIN_RELEVANT_SIZE) {
        printf("Allocating %zu bytes\n", size);
    }
    USED_MEMORY += size;
    const size_t total_size = size + sizeof(Header);
    auto* header = static_cast<Header*>(emscripten_builtin_malloc(total_size));
    if (header == nullptr) {
        fprintf(stderr, "Failed to allocate %zu bytes\n", size);
    }
    header->size = size;
    record_stack_trace(header, size);
    return header + 1;
}

void*
calloc(size_t nmemb, size_t size) {
    // printf("Allocating array: %zu elements of size %zu\n", nmemb, size);
    USED_MEMORY += nmemb * size;
    // return emscripten_builtin_calloc(nmemb, size);
    const size_t total_size = (nmemb * size) + sizeof(Header);
    auto* header = static_cast<Header*>(emscripten_builtin_malloc(total_size));
    if (header == nullptr) {
        fprintf(stderr, "Failed to allocate %zu bytes\n", size);
    }
    header->size = nmemb * size;
    memset(header + 1, 0, nmemb * size);
    record_stack_trace(header, size);
    return header + 1;
}

void
free(void* ptr) {
    // printf("Freeing memory at %p\n", ptr);

    if (ptr == nullptr) {
        emscripten_builtin_free(ptr);
    } else {
        auto* header = static_cast<Header*>(ptr) - 1;
        auto old_memory = USED_MEMORY;
        USED_MEMORY -= header->size;
        if (USED_MEMORY > old_memory) {
            std::abort();
        }
        emscripten_builtin_free(header);
    }
}

void*
memalign(size_t alignment, size_t size) {
    const size_t total_size = size + sizeof(Header);
    auto* header =
        static_cast<Header*>(emscripten_builtin_memalign(alignment, total_size)
        );
    if (header == nullptr) {
        fprintf(stderr, "Failed to allocate %zu bytes\n", size);
    }
    header->size = size;
    record_stack_trace(header, size);
    return header + 1;
}

int
posix_memalign(void** memptr, size_t alignment, size_t size) {
    auto* header = static_cast<Header*>(
        emscripten_builtin_memalign(alignment, size + sizeof(Header))
    );
    if (header == nullptr) {
        fprintf(stderr, "Failed to allocate %zu bytes\n", size);
    }
    header->size = size;
    USED_MEMORY += size;
    record_stack_trace(header, size);
    *memptr = header + 1;
    return 0;
}

void*
realloc(void* ptr, size_t new_size) {
    if (ptr == nullptr) {
        // If ptr is nullptr, realloc behaves like malloc
        return malloc(new_size);
    }

    if (new_size == 0) {
        // If new_size is 0, realloc behaves like free
        free(ptr);
        return nullptr;
    }

    auto* header = static_cast<Header*>(ptr) - 1;
    const size_t old_size = header->size;

    if (new_size <= old_size) {
        USED_MEMORY -= old_size - new_size;
        // If the new size is smaller or equal, we can potentially shrink the
        // block in place. For simplicity, we don't actually shrink the block
        // here.
        header->size = new_size; // Update the size in the header
        return ptr;              // Return the same pointer
    }

    // If the new size is larger, allocate a new block
    void* new_ptr = malloc(new_size);
    if (new_ptr == nullptr) {
        return nullptr;
    }

    memcpy(new_ptr, ptr, old_size);
    free(ptr);

    return new_ptr;
}