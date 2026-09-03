import { useEffect } from "react";

import {

  onRealtimeEvent,

  subscribeRealtimeScope,

} from "../services/realtimeClient";

 

function normalizeType(value = "") {

  return String(value || "").trim().toLowerCase();

}

 

function taskFromEvent(event = {}) {

  return event?.payload?.task || event?.task || event?.payload || event;

}

 

export default function useTaskRealtime({

  onTaskCreated,

  onTaskUpdated,

  onCommentCreated,

  onActivityCreated,

} = {}) {

  useEffect(() => {

    const unsubscribeScope = subscribeRealtimeScope({

      channel: "tasks",

    });

 

    const unsubscribeEvents = onRealtimeEvent((event = {}) => {

      const type = normalizeType(event?.type);

      const task = taskFromEvent(event);

 

      if (type === "task.created" || type === "task:created") {

        onTaskCreated?.(task);

        return;

      }

 

      if (

        type === "task.updated" ||

        type === "task:updated" ||

        type === "task.completed" ||

        type === "task:completed"

      ) {

        onTaskUpdated?.(task);

        return;

      }

 

      if (

        type === "task.comment_created" ||

        type === "task:comment_created"

      ) {

        onCommentCreated?.(event?.payload || event);

        return;

      }

 

      if (

        type === "task.activity_created" ||

        type === "task:activity_created"

      ) {

        onActivityCreated?.(event?.payload || event);

      }

    });

 

    return () => {

      unsubscribeEvents();

      unsubscribeScope();

    };

  }, [

    onTaskCreated,

    onTaskUpdated,

    onCommentCreated,

    onActivityCreated,

  ]);

}


