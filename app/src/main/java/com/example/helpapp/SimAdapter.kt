package com.example.helpapp

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.RadioButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import android.telephony.SubscriptionInfo

class SimAdapter(
    private val sims: List<SubscriptionInfo>,
    private val onSimSelected: (SubscriptionInfo) -> Unit
) : RecyclerView.Adapter<SimAdapter.SimViewHolder>() {

    private var selectedPosition = RecyclerView.NO_POSITION

    inner class SimViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val carrierName: TextView = itemView.findViewById(R.id.textCarrierName)
        val slotIndex: TextView = itemView.findViewById(R.id.textSlotIndex)
        val radioButton: RadioButton = itemView.findViewById(R.id.radioSelect)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SimViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_sim, parent, false)
        return SimViewHolder(view)
    }

    override fun onBindViewHolder(holder: SimViewHolder, position: Int) {
        val sim = sims[position]
        holder.carrierName.text = sim.carrierName?.toString() ?: "Unknown"
        holder.slotIndex.text = "Slot ${sim.simSlotIndex + 1}"
        holder.radioButton.isChecked = position == selectedPosition
        holder.itemView.setOnClickListener {
            selectPosition(holder.adapterPosition)
            onSimSelected(sim)
        }
        holder.radioButton.setOnClickListener {
            selectPosition(holder.adapterPosition)
            onSimSelected(sim)
        }
    }

    private fun selectPosition(position: Int) {
        if (position == selectedPosition) return
        val previous = selectedPosition
        selectedPosition = position
        if (previous != RecyclerView.NO_POSITION) notifyItemChanged(previous)
        notifyItemChanged(position)
    }

    override fun getItemCount(): Int = sims.size
}
