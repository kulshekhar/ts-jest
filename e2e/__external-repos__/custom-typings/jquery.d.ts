declare global {
	interface JQueryStatic {
		ajax<T>(url: string, settings?: JQuery.AjaxSettings): JQuery.jqXHR<T>
    }
}

export {}
