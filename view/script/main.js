window.addEventListener("load", () => {
	let page_load = document.getElementById("page_load");
	setTimeout(() => {
		page_load.setAttribute("aria-busy", "false");
		page_load.style.display = "none";
		page_load.style.visibility = "hidden";
		window.dispatchEvent(new Event("page_loaded"));
	}, 500); 
});
let clean_error = (form) => {
	let error_field = form.querySelector(".error.on");
	if (error_field) {
		error_field.classList.remove("on");
		setTimeout(() => {
			error_field.textContent = "";
		}, 1000);
	}
};

let submit_form = async (form) => {
	return new Promise(async (resolve, reject) => {
		let data = new FormData(form);
		data.append("user_token", user_token);
		await fetch(form.action, {
			body: data,
			method: form.method
		}).then(response => response.json()).then(data => {
			clean_error(form);
			if (data.error && data.field) {
				let input = form.querySelector(`input[name="${data.field}"]`);
				let input_wrapper = input.parentNode;
				error_field = input_wrapper.querySelector(".error");
				setTimeout(() => {
					error_field.textContent = data.error;
					error_field.classList.add("on");
					input.focus();
				}, 1000);
			}
			resolve(data);
		}).catch(error => {
			reject(error)
		});
	});
};
let filter_list = (selects, list) => {   
	for (let l of list.children) {
		l.style.display = "flex";
		for (let s of selects) {
			if (!s.value || s.value == "all") continue;
			let targetEl = l.querySelector(".description").querySelector(`.${s.name}`);
			if (!targetEl) continue;
			let lval = targetEl.textContent;
			if ((s.value == "nota" && lval) || (s.value != "nota" && lval !== s.value)) {
				l.style.display = "none";
				break;
			}
		}
	}
};

let insearch = false;
let search = (search_query, list) => {
	if (!insearch) insearch = true;
	for (let l of list.children) {
		l.style.display = "flex";
		if (!search_query) continue;
		let words = search_query.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
		let pattern = new RegExp(`\\b(${words.join('|')})\\b`, 'i');
		let targetEl = l.querySelector("a");
		let lval = targetEl.textContent;
		if (!pattern.test(lval)) {
			l.style.display = "none";
		}
	}
};
let showOptions = (id) => {
	let options_list = document.getElementById(id);
	options_list.parentNode.showModal();
	let btn = options_list.parentNode.parentNode.querySelector(`button[aria-controls='${id}']`);
	btn.setAttribute("aria-expanded", "true");
	options_list.children[0].focus();
};

let hideOptions = (id) => {
	let options_list = document.getElementById(id);
	options_list.parentNode.close();
	let btn = options_list.parentNode.parentNode.querySelector(`button[aria-controls='${id}']`);
	btn.setAttribute("aria-expanded", "false");
	btn.focus();
};
let errorVisible = null;
let errorTable = null;
let focused = null;
document.addEventListener("click", (event) => {
	if (errorVisible) {
		for (let e of errorVisible) {
			let field = errorTable.querySelectorAll(`input[name="${e.field}"]`)[e.index];
			field.previousElementSibling.classList.remove("on");
			setTimeout(() => {
					field.previousElementSibling.innerText = "";
			}, 1000);
		}
		errorVisible = null;
		errorTable = null;
	}
	if (focused && event.target.tagName.toLowerCase() != "input") {
		focused = null;
	}
});