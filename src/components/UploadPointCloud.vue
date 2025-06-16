<template>
  <div class="upload-form">
    <h2>Upload New Point Cloud</h2>
    <form @submit.prevent="uploadPointCloud">
      <div class="form-group">
        <label for="file">Point Cloud File (.copc.laz):</label>
        <input type="file" id="file" @change="handleFileChange" required accept=".laz">
      </div>
      <div class="form-group">
        <label for="description">Description:</label>
        <textarea id="description" v-model="description" rows="3" required></textarea>
      </div>
      <div class="form-actions">
        <button type="submit" :disabled="!file || !description || uploading">
          {{ uploading ? 'Uploading...' : 'Upload' }}
        </button>
        <button type="button" @click="$emit('cancel')" class="cancel-btn">Cancel</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="successMessage" class="success">{{ successMessage }}</div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const emit = defineEmits(['uploaded', 'cancel']);

const file = ref(null);
const description = ref('');
const error = ref(null);
const successMessage = ref('');
const uploading = ref(false);

const handleFileChange = (event) => {
  file.value = event.target.files[0];
  successMessage.value = '';
  error.value = '';
};

const uploadPointCloud = async () => {
  if (!file.value || !description.value) {
    error.value = 'File and description are required.';
    return;
  }

  const formData = new FormData();
  formData.append('file', file.value);
  formData.append('description', description.value);

  error.value = null;
  successMessage.value = '';
  uploading.value = true;

  try {
    await axios.post(process.env.API_URL + '/pointcloud-manager/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    successMessage.value = 'Point Cloud uploaded successfully!';
    description.value = '';
    const fileInput = document.querySelector('#file');
    if(fileInput) fileInput.value = '';
    file.value = null;

    setTimeout(() => {
        emit('uploaded');
    }, 1500);

  } catch (err) {
    console.error('Error uploading asset:', err);
    error.value = 'Failed to upload point cloud. Please try again.';
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
/* Copied from UploadAsset.vue for consistency */
.upload-form {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  max-width: 500px;
  margin: 20px auto;
}
h2 {
  text-align: center;
  color: #333;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.form-group input[type="file"],
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #42b983;
  color: white;
  font-weight: bold;
}
button:disabled {
  background-color: #a5d6b8;
  cursor: not-allowed;
}
button:hover:not(:disabled) {
  background-color: #369f77;
}
.cancel-btn {
    background-color: #f44336;
}
.cancel-btn:hover:not(:disabled) {
    background-color: #d32f2f;
}
.error {
  color: red;
  margin-top: 15px;
  text-align: center;
}
.success {
  color: green;
  margin-top: 15px;
  text-align: center;
}
</style> 