export class Task {
    constructor(id, title, details, date, time, done, userId) {
        this.id = id;
        this.title = title;
        this.details = details;
        this.date = date;
        this.time = time;
        this.done = done;
        this.userId = userId;
    }
}