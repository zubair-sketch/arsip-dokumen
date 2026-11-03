// DOM Elements
const video = document.getElementById('camera-stream');
const canvas = document.getElementById('canvas');
const btnStart = document.getElementById('btn-start-camera');
const btnCapture = document.getElementById('btn-capture');
const btnStop = document.getElementById('btn-stop-camera');
const btnUpload = document.getElementById('btn-upload');
const gallery = document.getElementById('archive-gallery');
const filterSelect = document.getElementById('filter-category');
const docCategorySelect = document.getElementById('doc-category');

let stream = null;

// Mengambil data dari localStorage
let documents = JSON.parse(localStorage.getItem('arsip_dokumen')) || [];

// --- LOGIKA KATEGORI DINAMIS ---
let defaultCategories = ["KTP", "Surat", "Invoice", "Lainnya"];
let categories = JSON.parse(localStorage.getItem('arsip_kategori')) || defaultCategories;

function renderCategories() {
    // Kosongkan opsi saat ini
    docCategorySelect.innerHTML = '';
    filterSelect.innerHTML = '<option value="Semua">Semua Kategori</option>';

    // Isi dengan daftar kategori terbaru
    categories.forEach(cat => {
        docCategorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        filterSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

// Tambah Kategori Baru
document.getElementById('btn-add-category').addEventListener('click', () => {
    const newCatInput = document.getElementById('new-category-name');
    const newCat = newCatInput.value.trim();

    if (!newCat) {
        alert('Nama kategori tidak boleh kosong!');
        return;
    }
    
    // Mengecek agar tidak ada kategori ganda (case-insensitive)
    const isDuplicate = categories.some(cat => cat.toLowerCase() === newCat.toLowerCase());
    if (isDuplicate) {
        alert('Kategori ini sudah ada!');
        return;
    }

    categories.push(newCat);
    localStorage.setItem('arsip_kategori', JSON.stringify(categories));
    
    newCatInput.value = ''; // Reset input
    renderCategories(); // Perbarui dropdown
    alert(`Kategori "${newCat}" berhasil ditambahkan!`);
});

// Inisialisasi tampilan awal
renderCategories();
renderGallery();

// --- LOGIKA SCANNER KAMERA ---
btnStart.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        video.srcObject = stream;
        
        btnStart.disabled = true;
        btnCapture.disabled = false;
        btnStop.disabled = false;
    } catch (err) {
        alert('Gagal mengakses kamera. Error: ' + err.message);
    }
});

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        
        btnStart.disabled = false;
        btnCapture.disabled = true;
        btnStop.disabled = true;
    }
}
btnStop.addEventListener('click', stopCamera);

btnCapture.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    simpanDokumen(imageData);
    stopCamera();
});

// --- LOGIKA UPLOAD MANUAL ---
btnUpload.addEventListener('click', () => {
    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Pilih file terlebih dahulu!');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        simpanDokumen(e.target.result);
        fileInput.value = ''; 
    };
    reader.readAsDataURL(file);
});

// --- LOGIKA PENYIMPANAN DOKUMEN ---
function simpanDokumen(base64Image) {
    const titleInput = document.getElementById('doc-title').value;
    const categoryInput = docCategorySelect.value;
    const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const dokumenBaru = {
        id: Date.now().toString(),
        title: titleInput || 'Dokumen Tanpa Nama',
        category: categoryInput,
        date: tanggal,
        image: base64Image
    };

    documents.push(dokumenBaru);
    localStorage.setItem('arsip_dokumen', JSON.stringify(documents));
    
    document.getElementById('doc-title').value = '';
    renderGallery();
    alert('Dokumen berhasil diarsipkan!');
}

function hapusDokumen(id) {
    if (confirm('Yakin ingin menghapus dokumen ini?')) {
        documents = documents.filter(doc => doc.id !== id);
        localStorage.setItem('arsip_dokumen', JSON.stringify(documents));
        renderGallery();
    }
}

filterSelect.addEventListener('change', renderGallery);

function renderGallery() {
    gallery.innerHTML = '';
    const filter = filterSelect.value;
    
    const filteredDocs = filter === 'Semua' 
        ? documents 
        : documents.filter(doc => doc.category === filter);

    if (filteredDocs.length === 0) {
        gallery.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">Belum ada arsip di kategori ini.</p>';
        return;
    }

    filteredDocs.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'doc-card';
        card.innerHTML = `
            <img src="${doc.image}" alt="${doc.title}">
            <div class="badge">${doc.category}</div>
            <h3>${doc.title}</h3>
            <small>${doc.date}</small>
            <button class="delete-btn" onclick="hapusDokumen('${doc.id}')">Hapus</button>
        `;
        gallery.appendChild(card);
    });
}