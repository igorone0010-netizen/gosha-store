// ==================== ПЕРЕМЕННЫЕ АДМИНКИ ====================
let selectedFiles = [];
let productTemplates = {};
let urlProducts = [];

// ==================== DRAG & DROP ДЛЯ ФАЙЛОВ ====================
document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('drop-area');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('dragover');
    }
    
    function unhighlight() {
        dropArea.classList.remove('dragover');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFileSelect(files);
    }
});

function handleFileSelect(files) {
    if (!isAdmin()) return;
    
    selectedFiles = Array.from(files);
    updateFileList();
    showQuickTemplate();
    generatePreviews();
}

function updateFileList() {
    const fileList = document.getElementById('file-list');
    const filesContainer = document.getElementById('files-container');
    const fileCount = document.getElementById('file-count');
    
    fileCount.textContent = selectedFiles.length;
    filesContainer.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-icon">🖼️</div>
            <div class="file-name" title="${file.name}">${file.name}</div>
            <button onclick="removeFile(${index})" style="background: none; border: none; color: #ff6b6b; cursor: pointer;">✕</button>
        `;
        filesContainer.appendChild(fileItem);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    if (selectedFiles.length === 0) {
        document.getElementById('quick-template').style.display = 'none';
        document.getElementById('batch-preview').style.display = 'none';
    } else {
        showQuickTemplate();
        generatePreviews();
    }
}

function showQuickTemplate() {
    const template = document.getElementById('quick-template');
    const container = document.getElementById('template-container');
    
    container.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const nameFromFile = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        
        const templateRow = document.createElement('div');
        templateRow.className = 'template-row';
        templateRow.innerHTML = `
            <input type="text" class="template-input product-name" value="${nameFromFile}" 
                   placeholder="Название товара" onchange="updateTemplate(${index})">
            <input type="number" class="template-input product-price" value="1999" 
                   placeholder="Цена" onchange="updateTemplate(${index})">
            <input type="number" class="template-input product-old-price" value="0" 
                   placeholder="Старая цена" onchange="updateTemplate(${index})">
            <select class="template-input product-category" onchange="updateTemplate(${index})">
                <option value="Экшн">Экшн</option>
                <option value="Приключения">Приключения</option>
                <option value="RPG">RPG</option>
                <option value="Стратегии">Стратегии</option>
                <option value="Спорт">Спорт</option>
                <option value="Гонки">Гонки</option>
                <option value="Разное">Разное</option>
            </select>
            <div>
                <label style="color: white; font-size: 10px;">
                    <input type="checkbox" class="product-new" onchange="updateTemplate(${index})"> Новинка
                </label>
                <label style="color: white; font-size: 10px;">
                    <input type="checkbox" class="product-discount" onchange="updateTemplate(${index})"> Скидка
                </label>
            </div>
        `;
        container.appendChild(templateRow);
        updateTemplate(index);
    });
    
    template.style.display = 'block';
}

function updateTemplate(index) {
    const row = document.getElementById('template-container').children[index];
    
    productTemplates[index] = {
        name: row.querySelector('.product-name').value,
        price: parseInt(row.querySelector('.product-price').value) || 0,
        oldPrice: parseInt(row.querySelector('.product-old-price').value) || null,
        category: row.querySelector('.product-category').value,
        isNew: row.querySelector('.product-new').checked,
        hasDiscount: row.querySelector('.product-discount').checked
    };
    
    generatePreviews();
}

function applyTemplateToAll() {
    const firstRow = document.getElementById('template-container').children[0];
    const name = firstRow.querySelector('.product-name').value;
    const price = firstRow.querySelector('.product-price').value;
    const oldPrice = firstRow.querySelector('.product-old-price').value;
    const category = firstRow.querySelector('.product-category').value;
    const isNew = firstRow.querySelector('.product-new').checked;
    const hasDiscount = firstRow.querySelector('.product-discount').checked;
    
    const rows = document.getElementById('template-container').children;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (i > 0) {
            row.querySelector('.product-name').value = name + ' ' + (i + 1);
        }
        row.querySelector('.product-price').value = price;
        row.querySelector('.product-old-price').value = oldPrice;
        row.querySelector('.product-category').value = category;
        row.querySelector('.product-new').checked = isNew;
        row.querySelector('.product-discount').checked = hasDiscount;
        
        updateTemplate(i);
    }
}

function generatePreviews() {
    const preview = document.getElementById('batch-preview');
    preview.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const template = productTemplates[index] || {};
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewItem.innerHTML = `
                <img src="${e.target.result}" class="preview-image" alt="${template.name}">
                <div class="preview-name" title="${template.name}">${template.name || 'Без названия'}</div>
                <div style="font-size: 10px; color: #667eea;">${template.price || 0} руб.</div>
                ${template.isNew ? '<div style="font-size: 8px; color: #ffd700;">NEW</div>' : ''}
            `;
        };
        reader.readAsDataURL(file);
        preview.appendChild(previewItem);
    });
    
    preview.style.display = 'grid';
}

async function addAllProducts() {
    if (!isAdmin()) return;
    
    let addedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < selectedFiles.length; i++) {
        try {
            const file = selectedFiles[i];
            const template = productTemplates[i];
            
            if (!template || !template.name || !template.price) {
                errorCount++;
                continue;
            }
            
            const imageUrl = await readFileAsDataURL(file);
            
            const newProduct = {
                id: Date.now() + i,
                name: template.name,
                price: template.price,
                originalPrice: template.hasDiscount && template.oldPrice ? template.oldPrice : null,
                imageUrl: imageUrl,
                image: imageUrl,
                discount: template.hasDiscount && template.oldPrice ? 
                    Math.round((1 - template.price / template.oldPrice) * 100) : null,
                isNew: template.isNew,
                category: template.category,
                isImage: true
            };
            
            productsData['playstation_personal'].push(newProduct);
            addedCount++;
            
        } catch (error) {
            errorCount++;
            console.error('Ошибка добавления товара:', error);
        }
    }
    
    updateProductsCount();
    showNotification(`Добавлено: ${addedCount} товаров. Ошибок: ${errorCount}`, 'success');
    
    // Очищаем форму
    selectedFiles = [];
    productTemplates = {};
    document.getElementById('file-list').style.display = 'none';
    document.getElementById('quick-template').style.display = 'none';
    document.getElementById('batch-preview').style.display = 'none';
    document.getElementById('file-input').value = '';
    
    if (currentSection === 'products') {
        displayProducts(productsData[currentCategory]);
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ==================== URL ФУНКЦИИ ====================
function previewUrlProducts() {
    if (!isAdmin()) return;
    
    const text = document.getElementById('url-products').value;
    const preview = document.getElementById('url-preview');
    const list = document.getElementById('url-list');
    const status = document.getElementById('url-status');
    
    if (!text.trim()) {
        preview.innerHTML = '';
        list.innerHTML = '';
        status.textContent = 'Готов к обработке';
        return;
    }
    
    try {
        const lines = text.split('\n').filter(line => line.trim());
        urlProducts = [];
        
        lines.forEach((line, index) => {
            const parts = line.split('|').map(part => part.trim());
            if (parts.length >= 3) {
                const product = {
                    id: Date.now() + index,
                    name: parts[0] || 'Без названия',
                    price: parseInt(parts[1]) || 0,
                    oldPrice: parts[2] && parts[2] !== '0' ? parseInt(parts[2]) : null,
                    imageUrl: parts[3] || '',
                    category: parts[4] || 'Разное',
                    hasDiscount: !!(parts[2] && parts[2] !== '0'),
                    isNew: false
                };
                
                urlProducts.push(product);
            }
        });
        
        status.textContent = `Найдено товаров: ${urlProducts.length}`;
        preview.innerHTML = '';
        
        urlProducts.forEach((product, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${product.imageUrl}" class="url-preview" 
                     onload="this.classList.add('valid')" 
                     onerror="this.classList.add('invalid')"
                     alt="${product.name}">
                <div class="preview-name">${product.name}</div>
                <div style="font-size: 10px; color: #667eea;">${product.price} руб.</div>
            `;
            preview.appendChild(previewItem);
        });
        
        showUrlProductsList();
        
    } catch (error) {
        status.textContent = 'Ошибка в формате данных';
    }
}

function showUrlProductsList() {
    const list = document.getElementById('url-list');
    list.innerHTML = '';
    
    urlProducts.forEach((product, index) => {
        const item = document.createElement('div');
        item.className = 'url-item';
        item.innerHTML = `
            <img src="${product.imageUrl}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px;" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAiIGhlaWdodD0iNzAiIHZpZXdCb3g9IjAgMCA3MCA3MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjcwIiBoZWlnaHQ9IjcwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjM1IiB5PSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo='">
            <input type="text" value="${product.name}" onchange="updateUrlProduct(${index}, 'name', this.value)" 
                   style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 8px; color: white; font-size: 12px;">
            <input type="number" value="${product.price}" onchange="updateUrlProduct(${index}, 'price', this.value)"
                   style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 8px; color: white; font-size: 12px;">
            <input type="number" value="${product.oldPrice || ''}" placeholder="0" onchange="updateUrlProduct(${index}, 'oldPrice', this.value)"
                   style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 8px; color: white; font-size: 12px;">
            <select onchange="updateUrlProduct(${index}, 'category', this.value)"
                    style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 8px; color: white; font-size: 12px;">
                <option value="Экшн" ${product.category === 'Экшн' ? 'selected' : ''}>Экшн</option>
                <option value="Приключения" ${product.category === 'Приключения' ? 'selected' : ''}>Приключения</option>
                <option value="RPG" ${product.category === 'RPG' ? 'selected' : ''}>RPG</option>
                <option value="Стратегии" ${product.category === 'Стратегии' ? 'selected' : ''}>Стратегии</option>
                <option value="Спорт" ${product.category === 'Спорт' ? 'selected' : ''}>Спорт</option>
                <option value="Гонки" ${product.category === 'Гонки' ? 'selected' : ''}>Гонки</option>
                <option value="Разное" ${product.category === 'Разное' ? 'selected' : ''}>Разное</option>
            </select>
            <div>
                <label style="color: white; font-size: 10px;">
                    <input type="checkbox" ${product.isNew ? 'checked' : ''} onchange="updateUrlProduct(${index}, 'isNew', this.checked)"> Новинка
                </label>
                <br>
                <label style="color: white; font-size: 10px;">
                    <input type="checkbox" ${product.hasDiscount ? 'checked' : ''} onchange="updateUrlProduct(${index}, 'hasDiscount', this.checked)"> Скидка
                </label>
            </div>
        `;
        list.appendChild(item);
    });
}

function updateUrlProduct(index, field, value) {
    if (urlProducts[index]) {
        urlProducts[index][field] = value;
        
        if (field === 'price' || field === 'oldPrice' || field === 'hasDiscount') {
            const product = urlProducts[index];
            if (product.hasDiscount && product.oldPrice) {
                product.discount = Math.round((1 - product.price / product.oldPrice) * 100);
            } else {
                product.discount = null;
            }
        }
    }
}

function addUrlProducts() {
    if (!isAdmin()) return;
    
    if (urlProducts.length === 0) {
        showNotification('Нет товаров для добавления', 'error');
        return;
    }
    
    let addedCount = 0;
    let errorCount = 0;
    
    urlProducts.forEach(product => {
        try {
            if (product.name && product.price && product.imageUrl) {
                const newProduct = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    originalPrice: product.hasDiscount ? product.oldPrice : null,
                    imageUrl: product.imageUrl,
                    image: product.imageUrl,
                    discount: product.discount,
                    isNew: product.isNew,
                    category: product.category,
                    isImage: true
                };
                
                productsData['playstation_personal'].push(newProduct);
                addedCount++;
            }
        } catch (error) {
            errorCount++;
        }
    });
    
    updateProductsCount();
    showNotification(`Добавлено: ${addedCount} товаров. Ошибок: ${errorCount}`, 'success');
    
    document.getElementById('url-products').value = '';
    document.getElementById('url-preview').innerHTML = '';
    document.getElementById('url-list').innerHTML = '';
    document.getElementById('url-status').textContent = 'Готов к обработке';
    urlProducts = [];
    
    if (currentSection === 'products') {
        displayProducts(productsData[currentCategory]);
    }
}

// ==================== ФУНКЦИИ УПРАВЛЕНИЯ ====================
function importProducts(input) {
    if (!isAdmin()) return;
    
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                productsData = importedData;
                updateProductsCount();
                showNotification('База товаров загружена!', 'success');
                
                if (currentSection === 'products') {
                    displayProducts(productsData[currentCategory]);
                }
            } catch (error) {
                showNotification('Ошибка загрузки файла', 'error');
            }
        };
        reader.readAsText(file);
    }
}

function clearAllProducts() {
    if (!isAdmin()) return;
    
    if (confirm('Вы уверены что хотите удалить ВСЕ товары? Это действие нельзя отменить!')) {
        productsData['playstation_personal'] = [];
        updateProductsCount();
        showNotification('Все товары удалены', 'warning');
        
        if (currentSection === 'products') {
            displayProducts(productsData[currentCategory]);
        }
    }
}
