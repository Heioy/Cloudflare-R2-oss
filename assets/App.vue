<template>
  <div class="drive-shell" @dragenter.prevent @dragover.prevent @drop.prevent="onDrop">
    <progress
      v-if="uploadProgress !== null"
      class="upload-progress"
      :value="uploadProgress"
      max="100"
    ></progress>

    <UploadPopup
      v-model="showUploadPopup"
      @upload="onUploadClicked"
      @createFolder="createFolder"
    ></UploadPopup>

    <aside class="drive-sidebar">
      <div class="drive-brand">
        <div class="drive-brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 3v18" />
            <path d="M5 8h14" />
            <path d="M7 16h10" />
          </svg>
        </div>
        <div>
          <div class="drive-brand-name">R2 Drive</div>
          <div class="drive-brand-subtitle">文件库</div>
        </div>
      </div>

      <div class="side-section-title">当前目录</div>
      <button
        class="side-item"
        :class="{ active: typeFilter === 'all' }"
        type="button"
        @click="typeFilter = 'all'"
      >
        <span class="side-dot blue"></span>
        <span>全部文件</span>
        <strong>{{ files.length + folders.length }}</strong>
      </button>
      <button
        class="side-item"
        :class="{ active: typeFilter === 'image' }"
        type="button"
        @click="typeFilter = 'image'"
      >
        <span class="side-dot green"></span>
        <span>图片</span>
        <strong>{{ categoryCounts.image }}</strong>
      </button>
      <button
        class="side-item"
        :class="{ active: typeFilter === 'document' }"
        type="button"
        @click="typeFilter = 'document'"
      >
        <span class="side-dot indigo"></span>
        <span>文档</span>
        <strong>{{ categoryCounts.document }}</strong>
      </button>
      <button
        class="side-item"
        :class="{ active: typeFilter === 'archive' }"
        type="button"
        @click="typeFilter = 'archive'"
      >
        <span class="side-dot purple"></span>
        <span>压缩包</span>
        <strong>{{ categoryCounts.archive }}</strong>
      </button>

      <div class="side-section-title">快捷操作</div>
      <button class="side-action" type="button" @click="showUploadPopup = true">
        <svg viewBox="0 0 24 24">
          <path d="M12 3v12" />
          <path d="m7 8 5-5 5 5" />
          <path d="M5 21h14" />
        </svg>
        <span>上传文件</span>
      </button>
      <button class="side-action" type="button" @click="createFolder">
        <svg viewBox="0 0 24 24">
          <path d="M3 7h5l2 3h11v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M12 14v4" />
          <path d="M10 16h4" />
        </svg>
        <span>新建文件夹</span>
      </button>

      <div class="side-summary">
        <div class="summary-title">目录统计</div>
        <div class="summary-row">
          <span>文件夹</span>
          <strong>{{ folders.length }}</strong>
        </div>
        <div class="summary-row">
          <span>文件</span>
          <strong>{{ files.length }}</strong>
        </div>
        <div class="summary-row">
          <span>文件大小</span>
          <strong>{{ formatSize(currentDirSize) }}</strong>
        </div>
      </div>

      <div class="side-summary storage-summary">
        <div class="summary-title">总容量空间统计</div>
        <table class="storage-table">
          <thead>
            <tr>
              <th>类别</th>
              <th>容量</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>最近一个月使用量</td>
              <td>{{ formatSize(recentMonthSize) }}</td>
            </tr>
            <tr>
              <td>当前总空间容量</td>
              <td>{{ formatSize(currentDirSize) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </aside>

    <main class="drive-main">
      <header class="drive-topbar">
        <label class="search-box">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input v-model.trim="search" type="search" aria-label="搜索文件" placeholder="搜索文件、文件夹或标签" />
        </label>

        <div class="sort-menu">
          <button class="icon-button" type="button" title="排序" @click="showMenu = true">
            <svg viewBox="0 0 24 24">
              <path d="M8 6h13" />
              <path d="M8 12h10" />
              <path d="M8 18h7" />
              <path d="M3 6h.01" />
              <path d="M3 12h.01" />
              <path d="M3 18h.01" />
            </svg>
          </button>
          <Menu
            v-model="showMenu"
            :items="[{ text: '名称A-Z' }, { text: '大小↑' }, { text: '大小↓' }, { text: '粘贴' }]"
            @click="onMenuClick"
          />
        </div>

        <button class="primary-button" type="button" @click="showUploadPopup = true">
          <svg viewBox="0 0 24 24">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          <span>上传</span>
        </button>
      </header>

      <section class="drive-hero">
        <div>
          <div class="hero-kicker">当前目录 / {{ currentFolderName }}</div>
          <h1>文件管理</h1>
          <nav class="breadcrumb" aria-label="路径导航">
            <button type="button" @click="cwd = ''">我的网盘</button>
            <template v-for="crumb in breadcrumbs" :key="crumb.path">
              <span>/</span>
              <button type="button" @click="cwd = crumb.path">{{ crumb.name }}</button>
            </template>
          </nav>
        </div>

        <div class="hero-actions">
          <button class="secondary-button" type="button" @click="createFolder">
            <svg viewBox="0 0 24 24">
              <path d="M3 7h5l2 3h11v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M12 14v4" />
              <path d="M10 16h4" />
            </svg>
            <span>新建文件夹</span>
          </button>
          <button class="secondary-button" type="button" @click="showUploadPopup = true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3v12" />
              <path d="m7 8 5-5 5 5" />
              <path d="M5 21h14" />
            </svg>
            <span>拖拽上传</span>
          </button>
        </div>
      </section>

      <section class="drive-toolbar">
        <div class="toolbar-summary">
          <strong>{{ visibleFolders.length + visibleFiles.length }}</strong>
          <span>个项目</span>
          <span>·</span>
          <span>{{ formatSize(visibleFilesSize) }}</span>
          <span v-if="search || typeFilter !== 'all'">· 已筛选</span>
        </div>
        <div class="view-toggle" aria-label="视图">
          <button class="selected" type="button" title="列表视图">
            <svg viewBox="0 0 24 24">
              <path d="M8 6h13" />
              <path d="M8 12h13" />
              <path d="M8 18h13" />
              <path d="M3 6h.01" />
              <path d="M3 12h.01" />
              <path d="M3 18h.01" />
            </svg>
          </button>
          <button type="button" title="宫格视图">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>
      </section>

      <section class="file-table" aria-label="文件列表">
        <div class="file-row file-row-head">
          <div>名称</div>
          <div>大小</div>
          <div>更新时间</div>
          <div>类型</div>
          <div></div>
        </div>

        <button
          v-if="cwd !== '' && typeFilter === 'all'"
          class="file-row file-row-button"
          type="button"
          @click="goParent"
        >
          <div class="name-cell">
            <div class="type-badge folder">DIR</div>
            <div class="name-text">
              <strong>..</strong>
              <span>返回上级目录</span>
            </div>
          </div>
          <div>-</div>
          <div>-</div>
          <div>目录</div>
          <div></div>
        </button>

        <div
          v-for="folder in visibleFolders"
          :key="folder"
          class="file-row"
          :class="{ selected: isSelected('folder', folder) }"
          @click="selectItem('folder', folder)"
          @dblclick="cwd = folder"
        >
          <div class="name-cell">
            <div class="type-badge folder">DIR</div>
            <div class="name-text">
              <strong>{{ folderName(folder) }}</strong>
              <span>{{ folder }}</span>
            </div>
          </div>
          <div>-</div>
          <div>-</div>
          <div>目录</div>
          <div class="row-actions">
            <button
              class="row-action"
              type="button"
              title="打开"
              @click.stop="cwd = folder"
            >
              <svg viewBox="0 0 24 24">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            <button
              class="row-action"
              type="button"
              title="更多"
              @click.stop="openContextMenu(folder)"
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 6h.01" />
                <path d="M12 12h.01" />
                <path d="M12 18h.01" />
              </svg>
            </button>
          </div>
        </div>

        <div
          v-for="file in visibleFiles"
          :key="fileKey(file)"
          class="file-row"
          :class="{ selected: isSelected('file', file) }"
          @click="selectItem('file', file)"
          @dblclick="preview(rawPath(file))"
        >
          <div class="name-cell">
            <MimeIcon
              class="table-mime"
              :content-type="contentType(file)"
              :thumbnail="thumbnailUrl(file)"
              :size="34"
            />
            <div class="name-text">
              <strong>{{ fileName(file) }}</strong>
            </div>
          </div>
          <div>{{ formatSize(fileSize(file)) }}</div>
          <div>{{ formatDate(file.uploaded) }}</div>
          <div>{{ fileTypeLabel(file) }}</div>
          <div class="row-actions">
            <a class="row-action" :href="rawPath(file)" target="_blank" title="打开">
              <svg viewBox="0 0 24 24">
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </a>
            <button
              class="row-action"
              type="button"
              title="更多"
              @click.stop="openContextMenu(file)"
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 6h.01" />
                <path d="M12 12h.01" />
                <path d="M12 18h.01" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <div v-if="loading" class="state-message">加载中...</div>
      <div v-else-if="!visibleFiles.length && !visibleFolders.length" class="state-message">
        没有文件
      </div>
    </main>

    <aside class="drive-details">
      <section v-if="selectedItem" class="details-card">
        <div class="details-preview">
          <img
            v-if="selectedItem.type === 'file' && thumbnailUrl(selectedItem.item)"
            :src="thumbnailUrl(selectedItem.item)"
            alt=""
            loading="lazy"
          />
          <div v-else class="details-preview-fallback">
            {{ selectedTypeCode }}
          </div>
        </div>
        <div class="details-body">
          <h2>{{ selectedName }}</h2>
          <p>{{ selectedSubtitle }}</p>

          <dl class="meta-list">
            <div>
              <dt>对象路径</dt>
              <dd>{{ selectedPath }}</dd>
            </div>
            <div>
              <dt>大小</dt>
              <dd>{{ selectedSize }}</dd>
            </div>
            <div>
              <dt>更新时间</dt>
              <dd>{{ selectedUploaded }}</dd>
            </div>
            <div>
              <dt>类型</dt>
              <dd>{{ selectedKind }}</dd>
            </div>
          </dl>

          <div class="details-actions">
            <a
              v-if="selectedItem.type === 'file'"
              class="primary-button"
              :href="rawPath(selectedItem.item)"
              target="_blank"
              download
            >
              下载
            </a>
            <button
              v-else
              class="primary-button"
              type="button"
              @click="cwd = selectedItem.item"
            >
              打开目录
            </button>
            <button class="icon-button" type="button" title="复制链接" @click="copySelectedLink">
              <svg viewBox="0 0 24 24">
                <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
                <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <section v-else class="details-empty">
        <div class="details-preview-fallback">R2</div>
        <h2>选择一个文件</h2>
        <p>在左侧列表中选择文件或目录后，这里会显示真实对象信息。</p>
      </section>

      <section class="activity-card">
        <h3>当前视图</h3>
        <div class="activity-item">
          <span class="activity-dot blue"></span>
          <span>目录：{{ currentFolderName }}</span>
        </div>
        <div class="activity-item">
          <span class="activity-dot green"></span>
          <span>文件夹 {{ visibleFolders.length }} 个，文件 {{ visibleFiles.length }} 个</span>
        </div>
        <div class="activity-item">
          <span class="activity-dot orange"></span>
          <span>展示大小 {{ formatSize(visibleFilesSize) }}</span>
        </div>
      </section>
    </aside>

    <Dialog v-model="showContextMenu">
      <div
        v-if="focusedItem"
        v-text="focusedItemLabel(focusedItem)"
        class="contextmenu-filename"
        @click.stop.prevent
      ></div>
      <ul v-if="typeof focusedItem === 'string'" class="contextmenu-list">
        <li>
          <button @click="copyLink(`/?p=${encodeURIComponent(focusedItem)}`)">
            <span>复制链接</span>
          </button>
        </li>
        <li>
          <button @click="moveFile(focusedItem + '_$folder$')">
            <span>移动</span>
          </button>
        </li>
        <li>
          <button class="danger-text" @click="removeFile(focusedItem + '_$folder$')">
            <span>删除</span>
          </button>
        </li>
      </ul>
      <ul v-else-if="focusedItem" class="contextmenu-list">
        <li>
          <button @click="renameFile(fileKey(focusedItem))">
            <span>重命名</span>
          </button>
        </li>
        <li>
          <a :href="rawPath(focusedItem)" target="_blank" download>
            <span>下载</span>
          </a>
        </li>
        <li>
          <button @click="clipboard = fileKey(focusedItem)">
            <span>复制</span>
          </button>
        </li>
        <li>
          <button @click="moveFile(fileKey(focusedItem))">
            <span>移动</span>
          </button>
        </li>
        <li>
          <button @click="copyLink(rawPath(focusedItem))">
            <span>复制链接</span>
          </button>
        </li>
        <li>
          <button class="danger-text" @click="removeFile(fileKey(focusedItem))">
            <span>删除</span>
          </button>
        </li>
      </ul>
    </Dialog>
  </div>
</template>

<script>
import {
  generateThumbnail,
  blobDigest,
  multipartUpload,
  SIZE_LIMIT,
} from "/assets/main.mjs";
import Dialog from "./Dialog.vue";
import Menu from "./Menu.vue";
import MimeIcon from "./MimeIcon.vue";
import UploadPopup from "./UploadPopup.vue";

export default {
  data: () => ({
    cwd: new URL(window.location).searchParams.get("p") || "",
    files: [],
    folders: [],
    clipboard: null,
    focusedItem: null,
    loading: false,
    order: null,
    search: "",
    selectedItem: null,
    showContextMenu: false,
    showMenu: false,
    showUploadPopup: false,
    typeFilter: "all",
    uploadProgress: null,
    uploadQueue: [],
  }),

  computed: {
    breadcrumbs() {
      if (!this.cwd) return [];
      const parts = this.cwd.split("/").filter(Boolean);
      return parts.map((name, index) => ({
        name,
        path: `${parts.slice(0, index + 1).join("/")}/`,
      }));
    },

    categoryCounts() {
      return this.files.reduce(
        (counts, file) => {
          const category = this.fileCategory(file);
          counts[category] = (counts[category] || 0) + 1;
          return counts;
        },
        { image: 0, document: 0, archive: 0, other: 0 }
      );
    },

    currentDirSize() {
      return this.files.reduce((sum, file) => sum + this.fileSize(file), 0);
    },

    currentFolderName() {
      return this.cwd ? this.cwd.replace(/\/$/, "").split("/").pop() : "根目录";
    },

    normalizedSearch() {
      return this.search.trim().toLowerCase();
    },

    recentMonthSize() {
      const recentMonthStart = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return this.files.reduce((sum, file) => {
        const uploadedTime = this.fileUploadedTime(file);
        if (!uploadedTime || uploadedTime < recentMonthStart) return sum;
        return sum + this.fileSize(file);
      }, 0);
    },

    visibleFiles() {
      let files = this.files;
      if (this.typeFilter !== "all") {
        files = files.filter((file) => this.fileCategory(file) === this.typeFilter);
      }
      if (this.normalizedSearch) {
        files = files.filter((file) => {
          const haystack = [
            this.fileName(file),
            this.fileKey(file),
            this.contentType(file),
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(this.normalizedSearch);
        });
      }
      return files;
    },

    visibleFilesSize() {
      return this.visibleFiles.reduce((sum, file) => sum + this.fileSize(file), 0);
    },

    visibleFolders() {
      if (this.typeFilter !== "all") return [];
      if (!this.normalizedSearch) return this.folders;
      return this.folders.filter((folder) =>
        this.folderName(folder).toLowerCase().includes(this.normalizedSearch)
      );
    },

    selectedKind() {
      if (!this.selectedItem) return "-";
      return this.selectedItem.type === "folder"
        ? "目录"
        : this.fileTypeLabel(this.selectedItem.item);
    },

    selectedName() {
      if (!this.selectedItem) return "";
      return this.selectedItem.type === "folder"
        ? this.folderName(this.selectedItem.item)
        : this.fileName(this.selectedItem.item);
    },

    selectedPath() {
      if (!this.selectedItem) return "";
      return this.selectedItem.type === "folder"
        ? this.selectedItem.item
        : this.fileKey(this.selectedItem.item);
    },

    selectedSize() {
      if (!this.selectedItem) return "-";
      return this.selectedItem.type === "folder"
        ? "-"
        : this.formatSize(this.fileSize(this.selectedItem.item));
    },

    selectedSubtitle() {
      if (!this.selectedItem) return "";
      return this.selectedItem.type === "folder"
        ? "R2 目录前缀"
        : this.contentType(this.selectedItem.item) || "未记录 content-type";
    },

    selectedTypeCode() {
      if (!this.selectedItem) return "R2";
      if (this.selectedItem.type === "folder") return "DIR";
      const category = this.fileCategory(this.selectedItem.item);
      if (category === "image") return "IMG";
      if (category === "archive") return "ZIP";
      if (this.contentType(this.selectedItem.item) === "application/pdf") return "PDF";
      return "R2";
    },

    selectedUploaded() {
      if (!this.selectedItem || this.selectedItem.type === "folder") return "-";
      return this.formatDate(this.selectedItem.item.uploaded);
    },
  },

  methods: {
    compareFiles(a, b) {
      if (this.order === "大小↑") return this.fileSize(a) - this.fileSize(b);
      if (this.order === "大小↓") return this.fileSize(b) - this.fileSize(a);
      return this.fileKey(a).localeCompare(this.fileKey(b));
    },

    contentType(file) {
      return (file && file.httpMetadata && file.httpMetadata.contentType) || "";
    },

    encodePath(path) {
      return String(path || "")
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
    },

    copyLink(link) {
      const url = new URL(link, window.location.origin);
      navigator.clipboard.writeText(url.toString());
      this.showContextMenu = false;
    },

    copySelectedLink() {
      if (!this.selectedItem) return;
      const link =
        this.selectedItem.type === "folder"
          ? `/?p=${encodeURIComponent(this.selectedItem.item)}`
          : this.rawPath(this.selectedItem.item);
      this.copyLink(link);
    },

    async copyPaste(source, target) {
      const uploadUrl = `/api/write/items/${this.encodePath(target)}`;
      await axios.put(uploadUrl, "", {
        headers: { "x-amz-copy-source": encodeURIComponent(source) },
      });
    },

    async createFolder() {
      try {
        const folderName = window.prompt("请输入文件夹名称");
        if (!folderName) return;
        this.showUploadPopup = false;
        const uploadUrl = `/api/write/items/${this.encodePath(
          `${this.cwd}${folderName}/_$folder$`
        )}`;
        await axios.put(uploadUrl, "");
        this.fetchFiles();
      } catch (error) {
        fetch("/api/write/")
          .then((value) => {
            if (value.redirected) window.location.href = value.url;
          })
          .catch(() => {});
        console.log(`Create folder failed`);
      }
    },

    fetchFiles() {
      this.files = [];
      this.folders = [];
      this.loading = true;
      fetch(`/api/children/${this.encodePath(this.cwd)}`)
        .then((res) => res.json())
        .then((files) => {
          this.files = Array.isArray(files.value) ? files.value : [];
          if (this.order) {
            this.files.sort((a, b) => this.compareFiles(a, b));
          }
          this.folders = Array.isArray(files.folders) ? files.folders : [];
          this.loading = false;
          this.ensureSelection();
        })
        .catch((error) => {
          console.error("Fetch files failed", error);
          this.loading = false;
          this.selectedItem = null;
        });
    },

    fileCategory(file) {
      const contentType = this.contentType(file);
      const name = this.fileName(file).toLowerCase();
      if (contentType.startsWith("image/")) return "image";
      if (
        ["application/gzip", "application/vnd.rar", "application/zip"].includes(contentType) ||
        /\.(zip|rar|7z|tar|gz|tgz)$/.test(name)
      ) {
        return "archive";
      }
      if (
        contentType.startsWith("text/") ||
        contentType === "application/pdf" ||
        /\.(pdf|txt|md|doc|docx|xls|xlsx|ppt|pptx|json|csv|log)$/.test(name)
      ) {
        return "document";
      }
      return "other";
    },

    fileName(file) {
      const key = this.fileKey(file);
      return key.split("/").pop() || key;
    },

    fileKey(file) {
      return (file && file.key) || "";
    },

    fileSize(file) {
      const size = Number(file && file.size);
      return Number.isFinite(size) ? size : 0;
    },

    fileUploadedTime(file) {
      if (!file || !file.uploaded) return 0;
      const uploadedTime = new Date(file.uploaded).getTime();
      return Number.isNaN(uploadedTime) ? 0 : uploadedTime;
    },

    fileTypeLabel(file) {
      const contentType = this.contentType(file);
      if (contentType) return contentType;
      const category = this.fileCategory(file);
      if (category === "archive") return "压缩包";
      if (category === "document") return "文档";
      if (category === "image") return "图片";
      return "文件";
    },

    folderName(folder) {
      return folder.replace(/\/$/, "").split("/").pop() || folder || "根目录";
    },

    focusedItemLabel(item) {
      return typeof item === "string" ? item : this.fileKey(item);
    },

    formatDate(value) {
      if (!value) return "-";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "-";
      return date.toLocaleString();
    },

    formatSize(size) {
      if (!Number.isFinite(size) || size <= 0) return "0 B";
      const units = ["B", "KB", "MB", "GB", "TB"];
      let i = 0;
      while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
      }
      return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
    },

    goParent() {
      this.cwd = this.cwd.replace(/[^\/]+\/$/, "");
    },

    ensureSelection() {
      const currentPath = this.selectedPath;
      const folder = this.folders.find((item) => item === currentPath);
      if (folder) {
        this.selectedItem = { type: "folder", item: folder };
        return;
      }
      const file = this.files.find((item) => this.fileKey(item) === currentPath);
      if (file) {
        this.selectedItem = { type: "file", item: file };
        return;
      }
      if (this.folders.length) {
        this.selectedItem = { type: "folder", item: this.folders[0] };
      } else if (this.files.length) {
        this.selectedItem = { type: "file", item: this.files[0] };
      } else {
        this.selectedItem = null;
      }
    },

    isSelected(type, item) {
      if (!this.selectedItem || this.selectedItem.type !== type) return false;
      return type === "folder"
        ? this.selectedItem.item === item
        : this.fileKey(this.selectedItem.item) === this.fileKey(item);
    },

    onDrop(ev) {
      let files;
      if (ev.dataTransfer.items) {
        files = [...ev.dataTransfer.items]
          .filter((item) => item.kind === "file")
          .map((item) => item.getAsFile());
      } else files = ev.dataTransfer.files;
      this.uploadFiles(files);
    },

    onMenuClick(text) {
      switch (text) {
        case "名称A-Z":
          this.order = null;
          break;
        case "大小↑":
          this.order = "大小↑";
          break;
        case "大小↓":
          this.order = "大小↓";
          break;
        case "粘贴":
          return this.pasteFile();
      }
      this.files.sort((a, b) => this.compareFiles(a, b));
    },

    onUploadClicked(fileElement) {
      if (!fileElement.value) return;
      this.uploadFiles(fileElement.files);
      this.showUploadPopup = false;
      fileElement.value = null;
    },

    openContextMenu(item) {
      this.focusedItem = item;
      this.showContextMenu = true;
      this.selectItem(typeof item === "string" ? "folder" : "file", item);
    },

    preview(filePath) {
      window.open(filePath);
    },

    rawPath(file) {
      return `/raw/${this.encodePath(this.fileKey(file))}`;
    },

    async pasteFile() {
      if (!this.clipboard) return;
      let newName = window.prompt("Rename to:");
      if (newName === null) return;
      if (newName === "") newName = this.clipboard.split("/").pop();
      await this.copyPaste(this.clipboard, `${this.cwd}${newName}`);
      this.fetchFiles();
    },

    async processUploadQueue() {
      if (!this.uploadQueue.length) {
        this.fetchFiles();
        this.uploadProgress = null;
        return;
      }

      /** @type File **/
      const { basedir, file } = this.uploadQueue.shift();
      let thumbnailDigest = null;

      if (file.type.startsWith("image/") || file.type === "video/mp4") {
        try {
          const thumbnailBlob = await generateThumbnail(file);
          const digestHex = await blobDigest(thumbnailBlob);

          const thumbnailUploadUrl = `/api/write/items/_$flaredrive$/thumbnails/${digestHex}.png`;
          try {
            await axios.put(thumbnailUploadUrl, thumbnailBlob);
            thumbnailDigest = digestHex;
          } catch (error) {
            fetch("/api/write/")
              .then((value) => {
                if (value.redirected) window.location.href = value.url;
              })
              .catch(() => {});
            console.log(`Upload ${digestHex}.png failed`);
          }
        } catch (error) {
          console.log(`Generate thumbnail failed`);
        }
      }

      try {
        const objectKey = `${basedir}${file.name}`;
        const uploadUrl = `/api/write/items/${this.encodePath(objectKey)}`;
        const headers = {};
        const onUploadProgress = (progressEvent) => {
          var percentCompleted = (progressEvent.loaded * 100) / progressEvent.total;
          this.uploadProgress = percentCompleted;
        };
        if (thumbnailDigest) headers["fd-thumbnail"] = thumbnailDigest;
        if (this.fileSize(file) >= SIZE_LIMIT) {
          await multipartUpload(this.encodePath(objectKey), file, {
            headers,
            onUploadProgress,
          });
        } else {
          await axios.put(uploadUrl, file, { headers, onUploadProgress });
        }
      } catch (error) {
        fetch("/api/write/")
          .then((value) => {
            if (value.redirected) window.location.href = value.url;
          })
          .catch(() => {});
        console.log(`Upload ${file.name} failed`, error);
      }
      setTimeout(this.processUploadQueue);
    },

    async removeFile(key) {
      if (!window.confirm(`确定要删除 ${key} 吗？`)) return;
      await axios.delete(`/api/write/items/${this.encodePath(key)}`);
      this.fetchFiles();
    },

    async renameFile(key) {
      const newName = window.prompt("重命名为:");
      if (!newName) return;
      await this.copyPaste(key, `${this.cwd}${newName}`);
      await axios.delete(`/api/write/items/${this.encodePath(key)}`);
      this.fetchFiles();
    },

    selectItem(type, item) {
      this.selectedItem = { type, item };
    },

    thumbnailUrl(file) {
      const digest = file && file.customMetadata && file.customMetadata.thumbnail;
      return digest ? `/raw/_$flaredrive$/thumbnails/${digest}.png` : null;
    },

    async moveFile(key) {
      const currentPath = this.cwd;
      const allFolders = [...this.folders];

      if (currentPath !== "") {
        const parentPath = currentPath.replace(/[^\/]+\/$/, "");
        if (!allFolders.includes(parentPath) && parentPath !== "") {
          allFolders.unshift(parentPath);
        }
      }

      if (!allFolders.includes("")) {
        allFolders.unshift("");
      }

      const folderOptions = allFolders.map((folder) => {
        const displayName =
          folder === ""
            ? "根目录"
            : folder === currentPath
              ? "当前目录"
              : folder.replace(/.*\/(?!$)|\//g, "") + "/";
        return { display: displayName, value: folder };
      });

      const options = folderOptions
        .map((opt, index) => `${index + 1}. ${opt.display}`)
        .join("\n");

      const promptText = `请选择目标目录(输入数字):\n${options}\n`;
      const selection = window.prompt(promptText);

      if (!selection) return;

      const selectedIndex = parseInt(selection) - 1;
      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= folderOptions.length) {
        alert("无效的选择");
        return;
      }

      const targetPath = folderOptions[selectedIndex].value;
      const normalizedPath =
        targetPath === "" ? "" : targetPath.endsWith("/") ? targetPath : targetPath + "/";

      try {
        if (key.endsWith("_$folder$")) {
          const sourceBasePath = key.slice(0, -9);
          const finalFileName = this.folderName(sourceBasePath);
          const targetBasePath = normalizedPath + finalFileName + "/";
          const allItems = await this.getAllItems(sourceBasePath);
          const totalItems = allItems.length;
          let processedItems = 0;

          for (const item of allItems) {
            const itemKey = this.fileKey(item);
            const relativePath = itemKey.substring(sourceBasePath.length);
            const newPath = targetBasePath + relativePath;

            try {
              await this.copyPaste(itemKey, newPath);
              await axios.delete(`/api/write/items/${this.encodePath(itemKey)}`);
              processedItems++;
              this.uploadProgress = totalItems ? (processedItems / totalItems) * 100 : null;
            } catch (error) {
              console.error(`移动 ${itemKey} 失败:`, error);
            }
          }

          const targetFolderPath = targetBasePath.slice(0, -1) + "_$folder$";
          await this.copyPaste(key, targetFolderPath);
          await axios.delete(`/api/write/items/${this.encodePath(key)}`);
          this.uploadProgress = null;
        } else {
          const finalFileName = key.split("/").pop();
          const targetFilePath = normalizedPath + finalFileName;
          await this.copyPaste(key, targetFilePath);
          await axios.delete(`/api/write/items/${this.encodePath(key)}`);
        }

        this.fetchFiles();
      } catch (error) {
        console.error("移动失败:", error);
        alert("移动失败,请检查目标路径是否正确");
      }
    },

    async getAllItems(prefix) {
      const items = [];
      let marker = null;

      do {
        const url = new URL(`/api/children/${this.encodePath(prefix)}`, window.location.origin);
        if (marker) {
          url.searchParams.set("marker", marker);
        }

        const response = await fetch(url);
        const data = await response.json();
        const values = Array.isArray(data.value) ? data.value : [];
        const folders = Array.isArray(data.folders) ? data.folders : [];

        items.push(...values);

        for (const folder of folders) {
          items.push({
            key: folder + "_$folder$",
            size: 0,
            uploaded: new Date().toISOString(),
          });

          const subItems = await this.getAllItems(folder);
          items.push(...subItems);
        }

        marker = data.marker;
      } while (marker);

      return items;
    },

    uploadFiles(files) {
      if (this.cwd && !this.cwd.endsWith("/")) this.cwd += "/";

      const uploadTasks = Array.from(files).map((file) => ({
        basedir: this.cwd,
        file,
      }));
      this.uploadQueue.push(...uploadTasks);
      setTimeout(() => this.processUploadQueue());
    },
  },

  watch: {
    cwd: {
      handler() {
        this.fetchFiles();
        const url = new URL(window.location);
        if ((url.searchParams.get("p") || "") !== this.cwd) {
          this.cwd ? url.searchParams.set("p", this.cwd) : url.searchParams.delete("p");
          window.history.pushState(null, "", url.toString());
        }
        document.title = `${this.cwd.replace(/.*\/(?!$)|\//g, "") || "/"} - 文件库`;
      },
      immediate: true,
    },
  },

  created() {
    window.addEventListener("popstate", () => {
      const searchParams = new URL(window.location).searchParams;
      if (searchParams.get("p") !== this.cwd) this.cwd = searchParams.get("p") || "";
    });
  },

  components: {
    Dialog,
    Menu,
    MimeIcon,
    UploadPopup,
  },
};
</script>

<style>
:root {
  --drive-bg: #f5f7fa;
  --drive-panel: #ffffff;
  --drive-text: #172033;
  --drive-muted: #64748b;
  --drive-subtle: #94a3b8;
  --drive-border: #dfe5ee;
  --drive-line: #edf1f5;
  --drive-primary: #2563eb;
  --drive-primary-dark: #1d4ed8;
  --drive-green: #16a34a;
  --drive-orange: #f59e0b;
  --drive-purple: #7c3aed;
  --drive-shadow: 0 12px 34px rgba(28, 39, 67, 0.08);
}

.drive-shell {
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr) 292px;
  min-height: 100%;
  background: var(--drive-bg);
  color: var(--drive-text);
}

.drive-shell > .popup {
  display: contents;
}

.drive-sidebar,
.drive-details {
  background: #fbfcfe;
}

.drive-sidebar {
  grid-column: 1;
  grid-row: 1;
  padding: 22px 16px;
  border-right: 1px solid var(--drive-border);
}

.drive-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 28px;
  padding: 0 6px;
}

.drive-brand-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #0891b2);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.2);
}

.drive-brand-name {
  font-size: 18px;
  font-weight: 800;
}

.drive-brand-subtitle {
  margin-top: 2px;
  color: var(--drive-muted);
  font-size: 12px;
}

.side-section-title {
  margin: 22px 10px 8px;
  color: var(--drive-subtle);
  font-size: 12px;
  font-weight: 800;
}

.side-item,
.side-action {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 40px;
  gap: 10px;
  margin: 4px 0;
  padding: 0 10px;
  border-radius: 8px;
  color: #334155;
  font-size: 14px;
  text-align: left;
}

.side-item strong {
  margin-left: auto;
  color: var(--drive-muted);
  font-size: 12px;
}

.side-item.active {
  background: #eaf1ff;
  color: var(--drive-primary-dark);
  font-weight: 800;
}

.side-action:hover,
.side-item:hover {
  background: #eef4fb;
}

.side-dot {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  border-radius: 5px;
}

.side-dot.blue {
  background: var(--drive-primary);
}

.side-dot.green {
  background: var(--drive-green);
}

.side-dot.indigo {
  background: #4f46e5;
}

.side-dot.purple {
  background: var(--drive-purple);
}

.side-summary {
  margin-top: 28px;
  padding: 14px;
  border: 1px solid var(--drive-border);
  border-radius: 8px;
  background: var(--drive-panel);
}

.summary-title {
  margin-bottom: 12px;
  font-weight: 800;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--drive-line);
  color: var(--drive-muted);
  font-size: 13px;
}

.summary-row strong {
  color: var(--drive-text);
}

.storage-summary {
  margin-top: 14px;
}

.storage-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.storage-table th,
.storage-table td {
  padding: 9px 0;
  border-top: 1px solid var(--drive-line);
  text-align: left;
  vertical-align: top;
}

.storage-table th {
  color: var(--drive-muted);
  font-weight: 800;
}

.storage-table td {
  color: var(--drive-muted);
}

.storage-table th:last-child,
.storage-table td:last-child {
  text-align: right;
}

.storage-table td:last-child {
  color: var(--drive-text);
  font-weight: 800;
  white-space: nowrap;
}

.drive-main {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  padding: 22px 26px 28px;
}

.drive-topbar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}

.search-box {
  position: relative;
  flex: 1;
}

.search-box svg {
  position: absolute;
  left: 14px;
  top: 50%;
  width: 18px;
  height: 18px;
  color: var(--drive-subtle);
  transform: translateY(-50%);
}

.search-box input {
  width: 100%;
  height: 42px;
  border: 1px solid var(--drive-border);
  border-radius: 8px;
  padding: 0 14px 0 42px;
  background: var(--drive-panel);
  outline: none;
}

.search-box input:focus {
  border-color: #93b5ff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.sort-menu {
  position: relative;
}

.sort-menu .menu {
  position: absolute;
  top: 100%;
  right: 0;
}

.primary-button,
.secondary-button,
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  border: 1px solid var(--drive-border);
  border-radius: 8px;
  padding: 0 14px;
  background: var(--drive-panel);
  color: var(--drive-text);
  white-space: nowrap;
}

.primary-button {
  border-color: var(--drive-primary);
  background: var(--drive-primary);
  color: #fff;
  font-weight: 800;
}

.secondary-button:hover,
.icon-button:hover {
  background: #f1f5f9;
}

.icon-button {
  width: 40px;
  padding: 0;
}

.drive-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.hero-kicker {
  margin-bottom: 8px;
  color: var(--drive-muted);
  font-size: 13px;
}

.drive-hero h1 {
  margin: 0;
  font-size: 26px;
  line-height: 1.2;
  letter-spacing: 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  color: var(--drive-muted);
  font-size: 14px;
}

.breadcrumb button {
  color: inherit;
  font-weight: 700;
}

.breadcrumb button:hover {
  color: var(--drive-primary);
}

.hero-actions {
  display: flex;
  gap: 10px;
}

.drive-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.toolbar-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--drive-muted);
  font-size: 14px;
}

.toolbar-summary strong {
  color: var(--drive-text);
}

.view-toggle {
  display: flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--drive-border);
  border-radius: 8px;
  background: #eef2f7;
}

.view-toggle button {
  display: grid;
  place-items: center;
  width: 32px;
  height: 30px;
  border-radius: 6px;
  color: var(--drive-muted);
}

.view-toggle .selected {
  background: var(--drive-panel);
  color: var(--drive-primary);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
}

.file-table {
  overflow: hidden;
  border: 1px solid var(--drive-border);
  border-radius: 8px;
  background: var(--drive-panel);
  box-shadow: var(--drive-shadow);
}

.file-row {
  display: grid;
  grid-template-columns: minmax(220px, 1.6fr) 110px 170px 150px 92px;
  align-items: center;
  width: 100%;
  padding: 0 14px;
  border-bottom: 1px solid var(--drive-line);
  color: var(--drive-muted);
  column-gap: 12px;
  text-align: left;
}

.file-row:not(.file-row-head) {
  height: 58px;
}

.file-row:last-child {
  border-bottom: 0;
}

.file-row:not(.file-row-head):hover,
.file-row.selected {
  background: #f7faff;
}

.file-row-head {
  min-height: 42px;
  background: #f8fafc;
  color: var(--drive-muted);
  font-size: 12px;
  font-weight: 800;
}

.file-row-button {
  cursor: pointer;
}

.name-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
  color: var(--drive-text);
}

.type-badge,
.details-preview-fallback {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 900;
}

.type-badge.folder {
  background: var(--drive-orange);
}

.table-mime {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
}

.table-mime.file-icon {
  width: 34px;
  height: 34px;
}

.table-mime img,
.table-mime svg {
  border-radius: 8px;
}

.table-mime svg,
.popup svg {
  fill: currentColor;
  stroke: none;
}

.table-mime svg path,
.popup svg path {
  fill: currentColor;
}

.name-text {
  min-width: 0;
}

.name-text strong,
.name-text span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name-text strong {
  color: var(--drive-text);
  line-height: 20px;
}

.name-text span {
  margin-top: 3px;
  color: var(--drive-muted);
  font-size: 12px;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.row-action {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--drive-muted);
}

.row-action:hover {
  background: #eaf1ff;
  color: var(--drive-primary);
}

.state-message {
  margin-top: 16px;
  color: var(--drive-muted);
  text-align: center;
}

.drive-details {
  grid-column: 3;
  grid-row: 1;
  padding: 22px 18px;
  border-left: 1px solid var(--drive-border);
}

.details-card,
.details-empty {
  border: 1px solid var(--drive-border);
  border-radius: 8px;
  background: var(--drive-panel);
  box-shadow: var(--drive-shadow);
}

.details-preview {
  padding: 18px;
  border-bottom: 1px solid var(--drive-line);
}

.details-preview img,
.details-preview-fallback {
  width: 100%;
  height: 160px;
  border-radius: 8px;
}

.details-preview img {
  object-fit: cover;
}

.details-preview-fallback {
  background: linear-gradient(135deg, #2563eb, #0891b2);
  font-size: 42px;
}

.details-body,
.details-empty {
  padding: 18px;
}

.details-body h2,
.details-empty h2 {
  overflow-wrap: anywhere;
  margin: 0 0 4px;
  font-size: 18px;
}

.details-body p,
.details-empty p {
  margin: 0;
  color: var(--drive-muted);
  font-size: 13px;
}

.meta-list {
  margin: 18px 0;
  border-top: 1px solid var(--drive-line);
}

.meta-list div {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 11px 0;
  border-bottom: 1px solid var(--drive-line);
  font-size: 13px;
}

.meta-list dt {
  flex: 0 0 auto;
  color: var(--drive-muted);
}

.meta-list dd {
  overflow-wrap: anywhere;
  margin: 0;
  text-align: right;
  font-weight: 700;
}

.details-actions {
  display: grid;
  grid-template-columns: 1fr 40px;
  gap: 10px;
}

.activity-card {
  margin-top: 18px;
}

.activity-card h3 {
  margin: 0 0 12px;
  font-size: 14px;
}

.activity-item {
  display: flex;
  gap: 10px;
  margin-bottom: 13px;
  color: var(--drive-muted);
  font-size: 13px;
  line-height: 1.45;
}

.activity-dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: 50%;
}

.activity-dot.blue {
  background: var(--drive-primary);
}

.activity-dot.green {
  background: var(--drive-green);
}

.activity-dot.orange {
  background: #ea580c;
}

.upload-progress {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 10000;
  width: 100%;
}

.contextmenu-filename {
  max-width: min(80vw, 520px);
}

.danger-text {
  color: #dc2626;
}

.drive-shell svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (max-width: 1120px) {
  .drive-shell {
    grid-template-columns: 210px minmax(0, 1fr);
  }

  .drive-details {
    display: none;
  }
}

@media (max-width: 760px) {
  .drive-shell {
    display: block;
  }

  .drive-sidebar {
    display: none;
  }

  .drive-main {
    padding: 18px 14px;
  }

  .drive-topbar,
  .drive-hero,
  .drive-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-actions {
    flex-wrap: wrap;
  }

  .file-row {
    grid-template-columns: minmax(0, 1fr) 76px;
  }

  .file-row:not(.file-row-head) {
    height: 66px;
  }

  .file-row-head,
  .file-row > div:nth-child(2),
  .file-row > div:nth-child(3),
  .file-row > div:nth-child(4),
  .file-row-button > div:nth-child(2),
  .file-row-button > div:nth-child(3),
  .file-row-button > div:nth-child(4) {
    display: none;
  }
}
</style>
