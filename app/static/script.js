function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    uploadInput = document.getElementById('fileInput');
    uploadBtn = document.getElementById('uploadBtn');
    load_file = document.querySelector('.load-file');
    load_file.style.display = 'none';
    loading = document.querySelector('.loading');
    loading.style.display = 'flex';
    uploadInput.style.display = 'none';
    uploadBtn.style.display = 'none';
    fetch('/upload/', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        loading.style.display = 'none';
        html = `<div class='info-file'>File ${data.filename} uploaded (${data.size} bytes)</div>
                <div class="table-response">`;
        if (data.status_code == 400){
            html += `${data.detail}`;
        } else if (date.status_code == 500){
            html += `${data.detail}`;
        } else {
            if (data.report.length > 1){
                data.report.forEach(site => {
                    html += `<div class='site'>
                        <div class='site-title'>${site.site_name}</div>`;
                    if (site.check_error === false){
                        html += `<div class='error-not'>Ошибок нет</div>`;
                    } else{
                        html += `<div class='error-yes'>Ошибки есть</div>`;
                    }
                    let i = 0;
                    if (site.products_error.length > 0) {
                        site.products_error.forEach(product =>{
                            i = i+1;
                            if (product.offer_error === false){
                                html += `<div class='product error-not'>`;
                            } else {
                                html += `<div class='product error-yes'>`;
                            }

                            html += `<span class="product-number">${i}</span>
                                <span class="product-id">id:${product.offer_id}</span>
                                <span class="product-name">name:${product.offer_name}</span>`;
                            html += `</div>`;
                        })
                    }
                    if (site.message){
                        html += `<div class="response-message">${site.message}</div>`
                    }
                    html += `</div>`;
                });
            } else {
                html += `<div class='site'>
                    <div class='site-title'>${data.report.site_name}</div>`;
                if (data.report.check_error === false){
                    html += `<div class='error-not'>Ошибок нет</div>`;
                } else{
                    html += `<div class='error-yes'>Ошибки есть</div>`;
                }
                let i = 0;
                if (data.report.products_error.length > 0) {
                    data.report.products_error.forEach(product =>{
                        i = i+1;
                        if (product.offer_error === false){
                            html += `<div class='product error-not'>`;
                        } else {
                            html += `<div class='product error-yes'>`;
                        }

                        html += `<span class="product-number">${i}</span>
                            <span class="product-id">id:${product.offer_id}</span>
                            <span class="product-name">name:${product.offer_name}</span>`;
                        html += `</div>`;
                    })
                }
                if (data.report.message){
                    html += `<div class="response-message">${data.report.message}</div>`
                }
                html += `</div>`;
            }
        }
        html += `</div>`;
        document.getElementById('result').innerHTML = html;
    })
    .catch(error => {
        console.log('Error:', error);
    });
    uploadInput.style.display = 'flex';
    uploadBtn.style.display = 'flex';
}

function loadSites() {
    $.get("/sites/", function(data) {
        let html = '<table><tr><th>ID</th><th>Name</th><th>URL</th><th>Filename</th></tr>';
        if (data){
            data.forEach(site => {
                html += `<tr>
                    <td class="site-id-${site.id}">${site.id}</td>
                    <td class="site-name-${site.id}"><a href="/admin/site/${site.id}">${site.name}</a></td>
                    <td class="site-url-${site.id}"><a href="${site.url}">${site.url}</a></td>
                    <td class="site-file-${site.id}">${site.filename}</td>
                    <td class="site-update-${site.id}"><button onclick='updateSiteBtn(${site.id});'>✏️</button></td>
                    <td class="site-delete-${site.id}"><button onclick='deleteSite(${site.id});'>-</button></td>
                </tr>`;
            });
        }
        html += `<tr>
            <td></td>
            <td><input class='new-site-name' name='new-site-name' placeholder="введите название сайта"></td>
            <td><input class='new-site-url' name='new-site-url' placeholder="введите ссылку сайта"></td>
            <td><input class='new-site-file' name='new-site-file' placeholder="введите название файла"></td>
            <td><button onclick='createSite();'>+</button></td></tr></table>`;
        $("#sites-list").html(html);
    });
}

function createSite() {
        const name = document.querySelector('.new-site-name').value;
        const url = document.querySelector('.new-site-url').value;
        const filename = document.querySelector('.new-site-file').value;
        arr = {name: name, url: url, filename: filename};
        const response = $.ajax({
                    url: '/sites/',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(arr),
                    success: function (response) {
                        console.log(response['status-code']);
                        if (response['status-code'] == 200){
                            loadSites();
                        } else{
                            console.log(response['detail']);
                        }
                    },
                    error: function () {
                        console.log("error");
                    }
                });
    }

function updateSiteBtn(id) {
    const name = document.querySelector('.site-name-' + id).textContent;
    const url = document.querySelector('.site-url-' + id).textContent;
    const filename = document.querySelector('.site-file-' + id).textContent;
    document.querySelector('.site-name-' + id).innerHTML = `<input class='input-site-name-${id}' name='input-site-name' value='${name}'></input>`;
    document.querySelector('.site-url-' + id).innerHTML = `<input class='input-site-url-${id}' name='input-site-url' value='${url}'></input>`;
    document.querySelector('.site-file-' + id).innerHTML = `<input class='input-site-file-${id}' name='input-site-file' value='${filename}'></input>`;
    document.querySelector('.site-update-' + id).innerHTML = `<button onclick='updateSite(${id});'>✏️</button>`;
    document.querySelector('.site-delete-' + id).innerHTML = `<button onclick='cancelUpdateSiteBtn(${id});'>x</button>`;
}

function deleteSite(id) {
    const response = $.ajax({
                url: '/sites/' + id,
                type: 'DELETE',
                success: function (response) {
                    if (response['status-code'] == 200){
                        console.log(response['detail']);
                        loadSites();
                    } else{
                        console.log(response['detail']);
                    }
                },
                error: function () {
                    console.log("error");
                }
            });
}

function cancelUpdateSiteBtn(id) {
    document.querySelector('.site-name-' + id).innerHTML = '<a href="/admin/site/' + id + '">' + document.querySelector('.input-site-name-' + id).value + '</a>';
    document.querySelector('.site-url-' + id).innerHTML = '<a href="/admin/site/' + id + '">' + document.querySelector('.input-site-url-' + id).value + '</a>';
    document.querySelector('.site-file-' + id).innerHTML = document.querySelector('.input-site-file-' + id).value;
    document.querySelector('.site-update-' + id).innerHTML = `<button onclick='updateSiteBtn(${id});'>✏️</button>`;
    document.querySelector('.site-delete-' + id).innerHTML = `<button onclick='deleteSite(${id});'>-</button>`;
}

function updateSite(id) {
    const name = document.querySelector('.input-site-name-' + id).value;
    const url = document.querySelector('.input-site-url-' + id).value;
    const filename = document.querySelector('.input-site-file-' + id).value;
    arr = {name: name, url: url, filename: filename};
    const response = $.ajax({
                url: '/sites/' + id,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(arr),
                success: function (response) {
                    if (response['status-code'] == 200){
                        console.log(response['detail']);
                        loadSites();
                    } else{
                        console.log(response['detail']);
                    }
                },
                error: function () {
                    console.log("error");
                }
            });
}

function createCategory(id) {
    const name = document.querySelector('.new-category-name').value;
    let parent_id = document.querySelector('.new-category-parent-id').value;
    const site_id = id;
    if (parent_id == '') {
        parent_id = null;
    }
    arr = {name: name, parent_id: parent_id, site_id: site_id};
    console.log(arr)
    const response = $.ajax({
                url: '/categories/',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(arr),
                success: function (response) {
                    if (response['status-code'] == 200){
                        console.log(response['detail']);
                        loadSites();
                    } else{
                        console.log(response['detail']);
                    }
                },
                error: function () {
                    console.log("error");
                }
            });
}

function updateCategoryBtn(id) {
    console.log(id);
    let name = document.querySelector('.category-name-' + id);
    console.log(name.textContext);
    let parent_id = document.querySelector('.category-parent-id-' + id).textContext;
    let product = document.querySelector('.category-product-' + id).textContent;
    const description = document.querySelector('.category-description-' + id).textContent;
    document.querySelector('.category-name-' + id).innerHTML = `<input class='input-category-name-${id}' name='input-category-name' value='${name}'></input>`;
    document.querySelector('.category-parent-id-' + id).innerHTML = `<input class='input-category-parent-id-${id}' name='input-category-parent-id' value='${parent-id}'></input>`;
//    document.querySelector('.category-product-' + id).innerHTML = `<input class='input-category-product-${id}' name='input-category-product' value='${product}'></input>`;
//    document.querySelector('.category-description-' + id).innerHTML = `<input class='input-category-description-${id}' name='input-category-description' value='${description}'></input>`;
    document.querySelector('.category-update-' + id).innerHTML = `<button onclick='updateCategory(${id});'>✏️</button>`;
    document.querySelector('.category-delete-' + id).innerHTML = `<button onclick='cancelUpdateCategoryBtn(${id});'>x</button>`;
}

function cancelUpdateCategoryBtn(id) {
    document.querySelector('.category-name-' + id).innerHTML = document.querySelector('.input-category-name-' + id).value;
    document.querySelector('.category-parent-id-' + id).innerHTML = document.querySelector('.input-category-parent-id-' + id).value;
//    document.querySelector('.category-product-' + id).innerHTML = document.querySelector('.input-category-product-' + id).value;
//    document.querySelector('.category-description-' + id).innerHTML = document.querySelector('.input-category-description-' + id).value;
    document.querySelector('.category-update-' + id).innerHTML = `<button onclick='updateCategoryBtn(${id});'>✏️</button>`;
    document.querySelector('.category-delete-' + id).innerHTML = `<button onclick='deleteCategory(${id});'>-</button>`;
}

function updateCategory(id) {
    const name = document.querySelector('.input-category-name-' + id).value;
    const parent_id = document.querySelector('.input-category-parent-id-' + id).value;
    const site_id = document.querySelector('.site-id').value;
    arr = {name: name, parent_id: parent_id, site_id: site_id};
    const response = $.ajax({
                url: '/categories/' + id,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(arr),
                success: function (response) {
                    if (response['status-code'] == 200){
                        console.log(response['detail']);
                        loadSites();
                    } else{
                        console.log(response['detail']);
                    }
                },
                error: function () {
                    console.log("error");
                }
            });
}

function deleteCategory(id){
    const response = $.ajax({
                url: '/categories/' + id,
                type: 'DELETE',
                success: function (response) {
                    if (response['status-code'] == 200){
                        console.log(response['detail']);
                        loadSites();
                    } else{
                        console.log(response['detail']);
                    }
                },
                error: function () {
                    console.log("error");
                }
            });
}

function createProduct(id) {
    div = document.querySelector('.div-category-product-'+id);
    name_input = document.querySelector('.create-new-product-input-'+id);
    name = name_input.value;
    const category_id = id;
    btn_create = document.querySelector('.new-product-'+id);
    arr = {name: name, category_id: category_id};
    const response = $.ajax({
                url: '/products/',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(arr),
                success: function (response) {
                    console.log(response);
                    if (response['status-code'] == 200){
                        console.log(response['detail']);
                        create_span = document.createElement('span');
                        create_span.classList.add('category-product-'+response['db_product']['id']);
                        create_span.classList.add(category_id);
                        create_span.setAttribute('onclick', 'updateProductBtn('+response['db_product']['id']+');');
                        create_span.innerHTML = response['db_product']['name'];
                        div.removeChild(name_input);
                        btn_create.before(create_span);
                        btn_create.setAttribute('onclick', 'newProductBtn(${id});');
                    } else{
                        console.log(response['detail']);
                    }
                },
                error: function () {
                    console.log("error");
                }
            });
}

function newProductBtn(id) {
    td_category_product = document.querySelector('.div-category-product-'+id);
    create_input_product = document.createElement('input');
    create_input_product.classList.add('create-new-product-input-'+id);
    new_product_btn = document.querySelector('.new-product-'+id);
    new_product_btn.before(create_input_product);
    document.querySelector('.new-product-'+id).setAttribute('onclick', 'createProduct('+id+');');
}

function updateProductBtn(id) {
    text_span = document.querySelector('.category-product-'+id).textContent;
    span_product = document.querySelector('.category-product-'+id);
    span_product.setAttribute('onclick', '');
    console.log(text_span);
    input_tag = document.createElement('input');
    input_tag.classList.add('category-product-input-'+id);
    input_tag.value = text_span;
    input_update_btn = document.createElement('button');
    input_update_btn.classList.add('category-product-button-'+id);
    input_update_btn.setAttribute('onclick', 'updateProduct('+id+');');
    input_update_btn.innerHTML = '✏️';
    span_product.innerHTML = '';
    span_product.append(input_tag);
    span_product.append(input_update_btn);
}

function updateProduct(id) {
    span_product = document.querySelector('.category-product-'+id);
    input_product_name = document.querySelector('.category-product-input-'+id);
    name = input_product_name.value;
    category_id = span_product.classList[1];
    input_update_btn = document.querySelector('.category-product-button-'+id);
    arr = {name: name, category_id: category_id};
    if (name) {
        const response = $.ajax({
                    url: '/products/' + id,
                    type: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify(arr),
                    success: function (response) {
                        if (response['status-code'] == 200){
                            console.log(response['detail']);
                            span_product.removeChild(input_product_name);
                            span_product.removeChild(input_update_btn);
                            span_product.setAttribute('onclick', 'updateProductBtn('+id+');');
                            html = `${response['db_product']['name']}`;
                            span_product.innerHTML = html;
                        } else{
                            console.log(response['detail']);
                        }
                    },
                    error: function () {
                        console.log("error");
                    }
                });
    } else {
        const response = $.ajax({
                url: '/products/' + id,
                type: 'DELETE',
                success: function (response) {
                    if (response['status-code'] == 200){
                        console.log(response['detail']);
                        span_product.remove();
                    } else{
                        console.log(response['detail']);
                    }
                },
                error: function () {
                    console.log("error");
                }
            });
    }
}

function createDescription(id){

}

