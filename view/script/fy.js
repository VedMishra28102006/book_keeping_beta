let fy_item = (row) => {
	return `<li id="fy_${row.fy_id}" style="anchor-name: --fy-${row.fy_id}; position-anchor: --fy-${row.fy_id};">
		<a href="#journal" onclick="
			fy_id = ${row.fy_id};
			fetch_journal('${row.fy_id}');
		">${row.fy_name}</a>
		<button aria-controls="options_fy_${row.fy_id}" aria-expanded="false" aria-haspopup="dialog" aria-label="Options for financial year ${row.fy_name}" class="options_button" onclick="
			event.stopPropagation();
			showOptions('options_fy_${row.fy_id}');				
		" style="anchor-name: --btn-fy-${row.fy_id}; position-anchor: --btn-fy-${row.fy_id};"><span aria-hidden="true">&vellip;</span></button>
		<dialog class="options_wrapper" style="position-anchor: --btn-fy-${row.fy_id}; z-index: 1">
			<div class="options" id="options_fy_${row.fy_id}">
				<button onclick="
					event.stopPropagation();
					fetch_fy(true, '${row.fy_id}');
				">Export</button>
				<button onclick="
					event.stopPropagation();
					fy_form.parentNode.showModal();
					fy_form.querySelector('#fy_id').value = '${row.fy_id}';
					fy_form.querySelector('#fy_name').value = '${row.fy_name}';
					fy_form.querySelector('#fy_status').value = '${row.fy_status}';
				">Edit</button>
				<button onclick="
					event.stopPropagation();
					fetch('/fy/${user_token}/${uid}/${row.fy_id}', {method: 'DELETE'});
					document.getElementById('fy_${row.fy_id}').remove();
				">Delete</button>
				<button aria-controls="details_fy_${row.fy_id}" aria-expanded="false" aria-haspopup="dialog" onclick="
					event.stopPropagation();
					hideOptions('options_fy_${row.fy_id}');
					showOptions('details_fy_${row.fy_id}');
				">Details</button>
				<button onclick="
					event.stopPropagation();
					hideOptions('options_fy_${row.fy_id}');
				">Close</button>
			</div>
		</dialog>
		<dialog class="options_wrapper" style="position-anchor: --btn-fy-${row.fy_id}; z-index: 1">
			<div class="options" id="details_fy_${row.fy_id}">
				<dl class="description">
					<dt>Name:</dt><dd class="name">${row.fy_name}</dd>
					<dt>Status:</dt><dd class="status">${row.fy_status}</dd>
				</dl>
				<button onclick="
					event.stopPropagation();
					hideOptions('details_fy_${row.fy_id}');
					showOptions('options_fy_${row.fy_id}');
				">Back</button>
				<button onclick="
					event.stopPropagation();
					hideOptions('details_fy_${row.fy_id}');
				">Close</button>
			</div>
		</dialog>
	</li>`;
};
let fy_list = document.getElementById("fy_list");
let fy_search = document.getElementById("fy_search");
let fy_filter_form = document.getElementById("fy_filter_form");
let fy_form = document.getElementById("fy_form");
fy_form.addEventListener("submit", async (event) => {
	event.preventDefault();
	if (audition && uid != audition) return;
	if (user_status == "locked") {
		alert("Your account has been locked");
		return;
	}
	submit_form(fy_form).then(data => {
		if (data.success) {
			let id = fy_form.querySelector("#fy_id").value;
			if (parseInt(id) != 0) {
				document.getElementById(`fy_${id}`).outerHTML = fy_item({
					fy_id: data.row.fy_id,
					fy_name: data.row.fy_name,
					fy_status: data.row.fy_status
				});
				fy_form.querySelector("#fy_id").value = "0";
				fy_form.parentNode.close();
				document.getElementById(`fy_${id}`).children[0].focus();
			} else {
				let temp_func = () => {
					if (!insearch) {
						fy_list.insertAdjacentHTML("beforeend", fy_item(data.row));
					}
					fy_form.querySelector('#fy_id').value = '0';
					fy_form.parentNode.close();
					fy_list.children[fy_list.children.length-1].scrollIntoView({
						behavior: "smooth",
						block: "center"
					});
					fy_list.children[fy_list.children.length-1].children[0].focus();
				};
				if (insearch) {
					fetch_fy().then(() =>{
						insearch = true;
						temp_func();
					});
				} else {
					temp_func();
				}
			}
		}
	})
	.catch(error => {
		alert(error);
	});
});
let fetch_fy = (download=false, id=0) => {
	if (download) {
		window.location.href = `/fy/${user_token}/${uid}/${id}?download=True`;
	} else return new Promise((resolve, reject) => {
		fy_list.innerHTML = "";
		fetch(`/fy/${user_token}/${uid}/${id}`, {method: "GET"})
		.then(response => response.json())
		.then(data => {
			for (row of data) {
				fy_list.insertAdjacentHTML("beforeend", fy_item(row));
			}
			resolve(data);
		})
		.catch(error => {
			reject(error);
		});
	});
};