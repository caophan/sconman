<template>
  <v-navigation-drawer app width="400">
    <v-dialog v-model="showDialog" width="500" persistent>
      <template v-slot:activator="{ on }">
        <v-btn small color="primary" v-on="on"
          ><v-icon left>mdi-folder</v-icon>New bucket</v-btn
        >
      </template>
      <v-card>
        <v-card-title
          >Create new bucket<v-spacer></v-spacer>
          <v-btn icon @click="showDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-text-field
            ref="bucket"
            v-model="bucketKey"
            autofocus
            solo
            :rules="[(v) => !!v || 'Bucket key is required']"
            required
          />
          For demonstration purposes, objects (files) are NOT automatically
          translated. After you upload, right click on the object and select
          "Translate". Bucket keys must be of the form [-_.a-z0-9]{3,128}
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="createNewBucket"
            >Go ahead, create the bucket</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-treeview
      ref="treeview"
      :items="buckets"
      item-key="id"
      item-text="text"
      activatable
      open-on-click
      return-object
      :load-children="getObjects"
      @update:active="selectData"
    >
      <template v-slot:prepend="{ item, open }">
        <v-icon v-if="item.type == 'bucket'">
          {{ open && item.children ? 'mdi-folder-open' : 'mdi-folder' }}
        </v-icon>
        <v-icon v-else>mdi-file-document-outline</v-icon>
      </template>
      <template v-slot:label="{ item }">
        <span @contextmenu.prevent="show($event, item)">{{ item.text }}</span>
      </template>
    </v-treeview>
    <v-menu
      v-if="currentItem"
      v-model="showMenu"
      :position-x="x"
      :position-y="y"
      offset-y
    >
      <v-list dense>
        <v-list-item-group>
          <v-list-item @click="handleMenu">
            <v-list-item-icon>
              <v-icon v-text="menu[currentItem.type].icon"></v-icon>
            </v-list-item-icon>
            <v-list-item-title>{{
              menu[currentItem.type].title
            }}</v-list-item-title>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-menu>
    <v-file-input
      v-show="false"
      ref="fileInput"
      v-model="file"
      @change="selectFile"
    />
  </v-navigation-drawer>
</template>

<script>
const jsonify = (res) => res.json()

export default {
  data: () => ({
    buckets: [],
    file: null,
    showMenu: false,
    showDialog: false,
    bucketKey: '',
    x: 0,
    y: 0,
    currentItem: undefined,
    menu: {
      bucket: {
        title: 'Upload file',
        icon: 'mdi-cloud-upload',
      },
      object: {
        title: 'Translate',
        icon: 'mdi-eye',
      },
    },
  }),

  watch: {
    showDialog(open) {
      if (open) {
        if (this.$refs.bucket) {
          this.$refs.bucket.resetValidation()
        }
      }
    },
  },

  mounted() {
    this.getBuckets()
  },

  methods: {
    show(e, item) {
      this.showMenu = false
      this.currentItem = item
      this.x = e.clientX
      this.y = e.clientY
      this.$nextTick(() => {
        this.showMenu = true
      })
    },

    getBuckets() {
      fetch('/api/forge/oss/buckets')
        .then(jsonify)
        .then((data) => {
          this.buckets = data.map((item) => {
            return {
              id: item.id,
              text: item.text,
              type: item.type,
              children: [],
            }
          })
        })
    },

    getObjects(item) {
      return fetch(
        '/api/forge/oss/buckets?' + new URLSearchParams({ id: item.id })
      )
        .then(jsonify)
        .then((data) => {
          const result = data.map((item) => {
            return {
              id: item.id,
              text: item.text,
              type: item.type,
            }
          })
          if (result.length === 0) {
            item.children = undefined
          } else {
            item.children = result
          }
        })
    },

    selectData(items) {
      if (items.length > 0) {
        if (items[0].type === 'object') {
          const objectName = items[0].id
          const bucketKey = this.getBucketId(objectName)
          this.$emit('selectData', {
            bucketKey,
            objectName,
          })
        }
      }
    },

    getBucketId(objectId) {
      const bucket = this.buckets.find(
        (item) =>
          item.children && item.children.some((obj) => obj.id === objectId)
      )
      return bucket.id
    },

    handleMenu() {
      if (this.currentItem.type === 'object') {
        this.translateObject()
      } else {
        this.uploadFile()
      }
    },

    translateObject() {
      const objectName = this.currentItem.id
      const bucketKey = this.getBucketId(objectName)
      this.$emit('translate', { bucketKey, objectName })
    },

    uploadFile() {
      this.$refs.fileInput.$refs.input.click()
    },

    selectFile(file) {
      const bucketKey = this.currentItem.id
      const formData = new FormData()
      formData.append('fileToUpload', file)
      formData.append('bucketKey', bucketKey)
      fetch('/api/forge/oss/objects', {
        method: 'POST',
        body: formData,
      }).then((res) => {
        this.file = null
        this.currentItem.children = []
        const temp = this.buckets
        this.buckets = []
        this.$nextTick(() => {
          this.buckets = temp
        })
      })
    },

    createNewBucket() {
      if (this.$refs.bucket.validate()) {
        fetch('/api/forge/oss/buckets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bucketKey: this.bucketKey }),
        }).then((res) => {
          this.showDialog = false
          this.bucketKey = ''
          this.buckets = []
          this.$nextTick(() => this.getBuckets())
        })
      }
    },
  },
}
</script>
