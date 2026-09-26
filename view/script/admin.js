let user_list = document.getElementById("user_list");
let user_item = (row) => {
	return `<li id="user_${row.user_id}">
		<a href="${(audition) ? `#fy_menu` : ``}" onclick="
			if (audition) {
				uid = ${row.user_id};
				fetch_fy();
			} else event.preventDefault();
		">${row.user_name}</a>
		<button aria-controls="options${row.user_id}" aria-expanded="false" aria-haspopup="dialog" aria-label="Options for user ${row.user_name}" class="options_button" onclick="
			event.stopPropagation();
			showOptions('options${row.user_id}');			
		" style="anchor-name: --btn-user_${row.user_id}; position-anchor: --btn-user_${row.user_id};"><span aria-hidden="true">&vellip;</span></button>
		<dialog class="options_wrapper" style="position-anchor: --btn-user_${row.user_id}; z-index: 1">
			<div class="options" id="options${row.user_id}">
				<button onclick="
					event.stopPropagation();
					user_form.parentNode.showModal();
					user_form.querySelector('#user_id').value = '${row.user_id}';
					user_form.querySelector('#admin_user_name').value = '${row.user_name}';
					user_form.querySelector('#admin_user_password').value = '';
					user_form.querySelector('#user_role').value = '${row.user_role}';
					user_form.querySelector('#user_department').value = '${row.user_department}';
					user_form.querySelector('#user_status').value = '${row.user_status}';
				">Edit</button>
				<button onclick="
					event.stopPropagation();
					delete_user('${row.user_id}');
				">Delete</button>
				<button aria-controls="details${row.user_id}" aria-expanded="false" aria-haspopup="dialog" onclick="
					event.stopPropagation();
					hideOptions('options${row.user_id}');
					showOptions('details${row.user_id}');
				">Details</button>
				<button onclick="
					event.stopPropagation();
					hideOptions('options${row.user_id}');
				">Close</button>
			</div>
		</dialog>
		<dialog class="options_wrapper" style="position-anchor: --btn-user_${row.user_id}; z-index: 1">
			<div class="options" id="details${row.user_id}">
				<dl class="description">
					<dt>Username:</dt><dd class="username">${row.user_name}</dd>
					<dt>Department:</dt><dd class="department">${row.user_department}</dd>
					<dt>Role:</dt><dd class="role">${row.user_role}</dd>
					<dt>Status:</dt><dd class="status">${row.user_status}</dd>
				</dl>
				<button onclick="
					event.stopPropagation();
					hideOptions('details${row.user_id}');
					showOptions('options${row.user_id}');
				">Back</button>
				<button onclick="
					event.stopPropagation();
					hideOptions('details${row.user_id}');
				">Close</button>
			</div>
		</dialog>
	</li>`;
};
let user_form = document.getElementById("user_form");
let user_filter_form = document.getElementById("user_filter_form");
user_form.addEventListener("submit", async (event) => {
	event.preventDefault();
	await submit_form(user_form).then(result => {
		if (result.success) {
			let id = user_form.querySelector("#user_id").value;
			if (parseInt(id) != 0) {
				document.getElementById(`user_${id}`).outerHTML = user_item({
					user_id: result.row.user_id,
					user_name: result.row.user_name,
					user_role: result.row.user_role,
					user_department: result.row.user_department,
					user_status: result.row.user_status
				});
				let dep = result.row.user_department;
				let found = 0;
				let depField = document.getElementById("user_filter_form").querySelector("select[name='department']");
				for (let o of depField.querySelectorAll("option")) {
					if (o.innerHTML == dep) found = 1;
				}
				if (!found) depField.insertAdjacentHTML("beforeend", `<option value="${dep}">${dep}</option>`);
				let deps = user_list.querySelectorAll(".department");
				found = 0;
				for (let d of deps) {
					if (d.textContent == result.olddep) {
						found = 1;
						break;
					}
				}
				if (!found) document.getElementById("user_filter_form").querySelector("select[name='department']").querySelector(`option[value="${result.olddep}"]`).remove();
				user_form.querySelector("#user_id").value = "0";
				user_form.parentNode.close();
				document.getElementById(`user_${id}`).children[0].focus();
			} else {
				let temp_func = () => {
					user_form.parentNode.close();
					let row = user_list.querySelector(`li[id="user_${result.row.user_id}"]`);
					if (!insearch) {
						user_list.insertAdjacentHTML("beforeend", user_item(result.row));
						row = user_list.querySelector(`li[id="user_${result.row.user_id}"]`);
						let dep = result.row.user_department;
						let found = 0;
						let depField = document.getElementById("user_filter_form").querySelector("select[name='department']");
						for (let o of depField.querySelectorAll("option")) {
							if (o.innerHTML == dep) found = 1;
						}
						if (!found) depField.insertAdjacentHTML("beforeend", `<option value="${dep}">${dep}</option>`);
						user_form.querySelector("#user_id").value = "0";
						user_form.parentNode.close();
					}
					row.scrollIntoView({
						behavior: "smooth",
						block: "center"
					});
					row.children[0].focus();
				};
				if (insearch) {
					fetch_user().then(() =>{
						insearch = true;
						temp_func();
					});
				} else {
					temp_func();
				}
			}
		}
	}).catch(error => {
		alert(error.msg);
	});
});
let fetch_user = () => {
	return new Promise((resolve, reject) => {
		user_list.innerHTML = "";
		fetch(`/user/${user_token}`, {method: "GET"})
		.then(response => response.json())
		.then(data => {
			for (row of data) {
				user_list.insertAdjacentHTML("beforeend", user_item(row));
				let dep = row.user_department;
				let found = 0;
				let depField = document.getElementById("user_filter_form").querySelector("select[name='department']");
				for (let o of depField.querySelectorAll("option")) {
					if (o.innerHTML == dep) {
						found = 1;
						break;
					}
				}
				if (!found) depField.insertAdjacentHTML('beforeend', `<option value="${dep}">${dep}</option>`);
			}
			filter_list(document.getElementById("user_filter_form").querySelectorAll("select"), user_list);
			resolve(data);
		})
		.catch(error => {
			reject(error);
		});
	});
};
let delete_user = (id) => {
	document.getElementById(`options${id}`).classList.remove("visible");
	let data = new FormData();
	data.append("user_id", id);
	fetch(`/user/${user_token}`, {
		body: data,
		method: "DELETE"
	})
	.then(response => response.json())
	.then(data => {
		if (data.error) {
			alert(data.error);
		} else if (data.success) {
			let u = document.getElementById(`user_${id}`);
			let dep = u.querySelector(".department").textContent;
			u.remove();
			let deps = user_list.querySelectorAll(".department");
			let found = 0;
			for (let d of deps) {
				if (d.textContent == dep) {
					found = 1;
					break;
				}
			}
			if (!found) document.getElementById("user_filter_form").querySelector("select[name='department']").querySelector(`option[value="${dep}"]`).remove();
		}
	})
	.catch(error => {
		alert(error);
	});
};
let export_data = async () => {
	if (["manager", "auditor"].includes(user_role)) return;
	await fetch(`/export/${user_token}`, {method: "GET"})
	.then(response => response.blob())
	.then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			let url = URL.createObjectURL(data);
			let a = document.createElement('a');
			a.href = url;
			a.download = `data.db`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	})
	.catch(error => {
		alert(error);
	});
};
let import_data = async () => {
	if (["manager", "auditor"].includes(user_role)) return;
	let importer = document.getElementById("importer");
	let file = await new Promise(resolve => {
		importer.onchange = () => resolve(importer.files[0]);
		importer.click();
	});
	if (!file) return;
	let data = new FormData();
	data.append("data", file);
	await fetch(`/import/${user_token}`, {
		body: data,
		method: "POST"
	})
	.then(response => response.json())
	.then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			fetch_user();
		}
	})
	.catch(error => {
		alert(error);
	});
};